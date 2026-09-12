/**
 * Inter-Method Distance Metrics and Agglomerative Hierarchical Clustering
 * according to Sections 4 & 5 of Tekile, Brunelli, & Fedrizzi (2023).
 */

import { CompletionResult, DistanceMatrixResult, MethodId } from '../types';
import { computeMatrixDistance, computeWeightDistance } from './matrixMath';

export interface ClusterNode {
  id: string;
  name: string;
  elements: MethodId[];
  distance: number;
  left?: ClusterNode;
  right?: ClusterNode;
}

/**
 * Compute the 11x11 pairwise Manhattan log-distance matrix D(L, B) [Eq. 20]
 * and weight distance matrix d^(u, v) [Eq. 21] across all results.
 */
export function computeDistanceMatrices(
  results: CompletionResult[]
): DistanceMatrixResult {
  const m = results.length;
  const methodIds = results.map((r) => r.methodId);

  const matrixDistances: number[][] = Array.from({ length: m }, () =>
    Array(m).fill(0)
  );
  const weightDistances: number[][] = Array.from({ length: m }, () =>
    Array(m).fill(0)
  );

  for (let s = 0; s < m; s++) {
    for (let t = s + 1; t < m; t++) {
      const distMat = computeMatrixDistance(
        results[s].completedMatrix,
        results[t].completedMatrix
      );
      const distW = computeWeightDistance(
        results[s].weights,
        results[t].weights
      );

      matrixDistances[s][t] = distMat;
      matrixDistances[t][s] = distMat;

      weightDistances[s][t] = distW;
      weightDistances[t][s] = distW;
    }
  }

  return {
    matrixDistances,
    weightDistances,
    methodIds,
  };
}

/**
 * Single-linkage agglomerative hierarchical clustering algorithm
 * as detailed on page 7 of the paper.
 */
export function performHierarchicalClustering(
  distanceMatrix: number[][],
  methodIds: MethodId[]
): ClusterNode {
  const n = methodIds.length;
  if (n === 0) {
    return { id: 'empty', name: 'Empty', elements: [], distance: 0 };
  }
  if (n === 1) {
    return { id: methodIds[0], name: methodIds[0], elements: [methodIds[0]], distance: 0 };
  }

  // Active clusters
  let clusters: ClusterNode[] = methodIds.map((id) => ({
    id,
    name: id,
    elements: [id],
    distance: 0,
  }));

  // Work distance matrix
  let dist: number[][] = distanceMatrix.map((row) => [...row]);
  let clusterIdCounter = 1;

  while (clusters.length > 1) {
    const k = clusters.length;
    let minD = Infinity;
    let minI = 0;
    let minJ = 1;

    // Find closest pair (min distance)
    for (let i = 0; i < k; i++) {
      for (let j = i + 1; j < k; j++) {
        if (dist[i][j] < minD) {
          minD = dist[i][j];
          minI = i;
          minJ = j;
        }
      }
    }

    const cA = clusters[minI];
    const cB = clusters[minJ];

    // Merge into new cluster
    const merged: ClusterNode = {
      id: `C${clusterIdCounter++}`,
      name: `{${[...cA.elements, ...cB.elements].join(', ')}}`,
      elements: [...cA.elements, ...cB.elements],
      distance: minD,
      left: cA,
      right: cB,
    };

    // Single-linkage distance update: d(new, z) = min(d(cA, z), d(cB, z))
    const newDistances: number[] = [];
    for (let z = 0; z < k; z++) {
      if (z !== minI && z !== minJ) {
        newDistances.push(Math.min(dist[minI][z], dist[minJ][z]));
      }
    }

    // Filter old clusters and build new distance matrix
    const nextClusters: ClusterNode[] = [];
    const remainingIndices: number[] = [];
    for (let i = 0; i < k; i++) {
      if (i !== minI && i !== minJ) {
        nextClusters.push(clusters[i]);
        remainingIndices.push(i);
      }
    }
    nextClusters.push(merged);

    const newK = nextClusters.length;
    const nextDist: number[][] = Array.from({ length: newK }, () =>
      Array(newK).fill(0)
    );

    for (let i = 0; i < remainingIndices.length; i++) {
      for (let j = 0; j < remainingIndices.length; j++) {
        nextDist[i][j] = dist[remainingIndices[i]][remainingIndices[j]];
      }
      nextDist[i][newK - 1] = newDistances[i];
      nextDist[newK - 1][i] = newDistances[i];
    }

    clusters = nextClusters;
    dist = nextDist;
  }

  return clusters[0];
}
