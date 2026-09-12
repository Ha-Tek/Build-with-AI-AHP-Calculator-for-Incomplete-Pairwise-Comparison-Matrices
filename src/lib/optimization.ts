/**
 * Numerical Optimization Algorithms (Bounded Nelder-Mead Simplex and Coordinate Search)
 * tailored for AHP completion problems with interval constraints [lb, ub].
 */

export interface OptimizeOptions {
  maxIter?: number;
  maxEval?: number;
  tol?: number;
  initialStep?: number;
}

/**
 * Box-constrained Nelder-Mead Simplex optimization algorithm.
 * Uses projection/barrier to enforce lower and upper bounds.
 */
export function optimizeNelderMead(
  costFunc: (x: number[]) => number,
  x0: number[],
  lowerBounds: number[],
  upperBounds: number[],
  options: OptimizeOptions = {}
): { x: number[]; fval: number; iterations: number } {
  const dim = x0.length;
  if (dim === 0) {
    return { x: [], fval: costFunc([]), iterations: 0 };
  }

  const maxIter = options.maxIter ?? 500;
  const maxEval = options.maxEval ?? 2000;
  const tol = options.tol ?? 1e-6;
  const initialStep = options.initialStep ?? 0.2;

  // Project into bounds
  function project(x: number[]): number[] {
    return x.map((v, i) => Math.max(lowerBounds[i], Math.min(upperBounds[i], v)));
  }

  // Cost function with penalty outside bounds
  function evalCost(x: number[]): number {
    let penalty = 0;
    const projected = x.map((v, i) => {
      if (v < lowerBounds[i]) {
        penalty += 1e4 * Math.pow(lowerBounds[i] - v, 2);
        return lowerBounds[i];
      }
      if (v > upperBounds[i]) {
        penalty += 1e4 * Math.pow(v - upperBounds[i], 2);
        return upperBounds[i];
      }
      return v;
    });
    return costFunc(projected) + penalty;
  }

  // Coefficients
  const alpha = 1.0; // reflection
  const gamma = 2.0; // expansion
  const rho = 0.5; // contraction
  const sigma = 0.5; // shrink

  // Initialize simplex (dim + 1 points)
  const simplex: number[][] = [project([...x0])];
  const fvals: number[] = [evalCost(simplex[0])];
  let evals = 1;

  for (let i = 0; i < dim; i++) {
    const point = [...simplex[0]];
    const boundRange = upperBounds[i] - lowerBounds[i];
    const step = initialStep * (boundRange > 0 ? boundRange : 1.0);
    if (point[i] + step <= upperBounds[i]) {
      point[i] += step;
    } else {
      point[i] -= step;
    }
    const projPoint = project(point);
    simplex.push(projPoint);
    fvals.push(evalCost(projPoint));
    evals++;
  }

  let iterations = 0;

  while (iterations < maxIter && evals < maxEval) {
    iterations++;

    // Sort simplex vertices by cost
    const indices = Array.from({ length: dim + 1 }, (_, i) => i);
    indices.sort((a, b) => fvals[a] - fvals[b]);

    const sortedSimplex = indices.map((i) => simplex[i]);
    const sortedFvals = indices.map((i) => fvals[i]);

    for (let i = 0; i <= dim; i++) {
      simplex[i] = sortedSimplex[i];
      fvals[i] = sortedFvals[i];
    }

    // Check convergence: difference between best and worst fval
    const fDiff = fvals[dim] - fvals[0];
    let maxDist = 0;
    for (let i = 1; i <= dim; i++) {
      for (let j = 0; j < dim; j++) {
        maxDist = Math.max(maxDist, Math.abs(simplex[i][j] - simplex[0][j]));
      }
    }

    if (fDiff < tol && maxDist < tol) {
      break;
    }

    // Calculate centroid of the best dim points
    const centroid = Array(dim).fill(0);
    for (let i = 0; i < dim; i++) {
      for (let j = 0; j < dim; j++) {
        centroid[j] += simplex[i][j] / dim;
      }
    }

    // 1. Reflection
    const xr = Array(dim).fill(0);
    for (let j = 0; j < dim; j++) {
      xr[j] = centroid[j] + alpha * (centroid[j] - simplex[dim][j]);
    }
    const fxr = evalCost(xr);
    evals++;

    if (fxr >= fvals[0] && fxr < fvals[dim - 1]) {
      simplex[dim] = xr;
      fvals[dim] = fxr;
      continue;
    }

    // 2. Expansion
    if (fxr < fvals[0]) {
      const xe = Array(dim).fill(0);
      for (let j = 0; j < dim; j++) {
        xe[j] = centroid[j] + gamma * (xr[j] - centroid[j]);
      }
      const fxe = evalCost(xe);
      evals++;

      if (fxe < fxr) {
        simplex[dim] = xe;
        fvals[dim] = fxe;
      } else {
        simplex[dim] = xr;
        fvals[dim] = fxr;
      }
      continue;
    }

    // 3. Contraction
    let xc = Array(dim).fill(0);
    if (fxr < fvals[dim]) {
      // Outside contraction
      for (let j = 0; j < dim; j++) {
        xc[j] = centroid[j] + rho * (xr[j] - centroid[j]);
      }
    } else {
      // Inside contraction
      for (let j = 0; j < dim; j++) {
        xc[j] = centroid[j] + rho * (simplex[dim][j] - centroid[j]);
      }
    }
    const fxc = evalCost(xc);
    evals++;

    if (fxc < Math.min(fxr, fvals[dim])) {
      simplex[dim] = xc;
      fvals[dim] = fxc;
      continue;
    }

    // 4. Shrink
    for (let i = 1; i <= dim; i++) {
      for (let j = 0; j < dim; j++) {
        simplex[i][j] = simplex[0][j] + sigma * (simplex[i][j] - simplex[0][j]);
      }
      fvals[i] = evalCost(simplex[i]);
      evals++;
    }
  }

  const bestX = project(simplex[0]);
  const bestFval = costFunc(bestX);

  return {
    x: bestX,
    fval: bestFval,
    iterations,
  };
}

/**
 * Coordinate search optimization for box-constrained non-linear problems.
 * Very reliable for multimodal or discontinuous gradients.
 */
export function optimizeCoordinateSearch(
  costFunc: (x: number[]) => number,
  x0: number[],
  lowerBounds: number[],
  upperBounds: number[],
  maxIter = 60
): { x: number[]; fval: number } {
  const dim = x0.length;
  if (dim === 0) {
    return { x: [], fval: costFunc([]) };
  }

  let currentX = x0.map((v, i) => Math.max(lowerBounds[i], Math.min(upperBounds[i], v)));
  let currentFval = costFunc(currentX);

  for (let iter = 0; iter < maxIter; iter++) {
    let improved = false;
    for (let i = 0; i < dim; i++) {
      const originalVal = currentX[i];
      const range = upperBounds[i] - lowerBounds[i];
      const steps = 15;
      const stepSize = range / steps;

      let bestVal = originalVal;
      let bestF = currentFval;

      for (let s = 0; s <= steps; s++) {
        const candidate = lowerBounds[i] + s * stepSize;
        currentX[i] = candidate;
        const f = costFunc(currentX);
        if (f < bestF) {
          bestF = f;
          bestVal = candidate;
        }
      }

      currentX[i] = bestVal;
      if (bestF < currentFval - 1e-7) {
        currentFval = bestF;
        improved = true;
      }
    }

    if (!improved) break;
  }

  return { x: currentX, fval: currentFval };
}
