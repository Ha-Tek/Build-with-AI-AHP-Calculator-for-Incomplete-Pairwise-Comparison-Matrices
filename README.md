# Building an AHP Calculator for Incomplete Pairwise Comparison Matrices

An interactive **Analytic Hierarchy Process (AHP)** calculator for completing incomplete pairwise comparison matrices (PCMs) using the **11 methods described in the referenced research paper**.

## Project Overview

The application was developed by prompting **Gemini in Google AI Studio** to act as an expert in:

* Analytic Hierarchy Process (AHP)
* Numerical methods
* Matrix completion
* Web application development

### Authoritative Research Source

The implementation is based on the following research paper:

[ScienceDirect Research Paper](https://www.sciencedirect.com/science/article/pii/S2214716023000076)

> **Important:** The 11 methods described in the paper are implemented according to the equations, assumptions, and calculation procedures presented in the research paper. Generic matrix-completion techniques should not be substituted for the methods described in the paper.

## Prompt Used in Google AI Studio

```text
Act as an expert in AHP, numerical methods, and web application development.

Using the attached research paper as the authoritative source, build an interactive calculator for completing incomplete pairwise comparison matrices (PCMs) using the 11 methods described in the paper.

Requirements:

1. Extract and correctly implement all 11 methods exactly as presented in the paper.

2. Allow users to:
   - Enter an incomplete pairwise comparison matrix.
   - Automatically enforce reciprocal values and diagonal = 1.
   - Select one method or run all 11 methods.

3. For each method, calculate:
   - Completed matrix
   - Estimated missing comparisons
   - Priority/weight vector
   - λmax
   - CI
   - CR
   - Consistency status

4. Build a visual dashboard comparing all 11 methods, including:
   - CR comparison
   - Priority-weight comparison
   - Estimated missing-value comparison
   - Final ranking comparison

5. Highlight methods that pass/fail the CR threshold (default CR ≤ 0.10).

6. Validate the implementation against the numerical examples in the paper and report any discrepancies.

7. Provide clear error handling, calculation details, and warnings for invalid or insufficient input.

8. Allow results to be exported to Excel/CSV.

Technology:

Prefer Python + Streamlit + NumPy + Pandas + SciPy + Plotly.

Organize the code into modular components for:
- The 11 methods
- Matrix validation
- Consistency calculations
- Dashboard
- Tests

Important:
Do not substitute generic matrix-completion techniques for the 11 methods in the paper. Preserve the paper's equations, assumptions, and calculation procedures.
```

## Key Features

### Incomplete PCM Input

<img width="867" height="573" alt="AHP_Calc1" src="https://github.com/user-attachments/assets/b69b3f85-621c-47c6-a0d3-917e3e91e1da" />



Users can enter an incomplete pairwise comparison matrix. The application automatically:

* Enforces reciprocal values.
* Sets the diagonal elements to `1`.
* Validates matrix structure.
* Detects invalid or insufficient inputs.

### 11 Matrix-Completion Methods

<img width="870" height="584" alt="Execute_allMethods" src="https://github.com/user-attachments/assets/df4d34eb-e00f-49e2-b5cc-631f03b9e18b" />

The calculator implements the **11 methods presented in the research paper** and allows users to:

* Run a single method.
* Run all 11 methods.
* Compare the resulting solutions.

### Consistency Analysis

For each method, the application calculates:

* Completed pairwise comparison matrix
* Estimated missing comparisons
* Priority/weight vector
* Maximum eigenvalue (`λmax`)
* Consistency Index (CI)
* Consistency Ratio (CR)
* Consistency status

The default consistency criterion is:

```text
CR ≤ 0.10
```

Methods that satisfy the threshold are identified separately from those that fail.

## Visual Dashboard



The dashboard provides a visual comparison of the 11 methods, including:

* **Consistency Ratio (CR) comparison**

<img width="842" height="560" alt="CR_AHP" src="https://github.com/user-attachments/assets/e842b85e-7794-43df-a269-7c0c94e7308b" />

* **Priority/weight comparison**
  
<img width="1086" height="586" alt="Priority_weight" src="https://github.com/user-attachments/assets/8639c2d6-e388-4098-8c66-a10294c54760" />

* **Estimated missing-value comparison**


<img width="976" height="352" alt="Est_Missing_Values" src="https://github.com/user-attachments/assets/09ef4e1f-1a80-42be-9c4d-1410ecde7cdc" />



This makes it easier to evaluate how different completion methods affect the final AHP results.

## Validation

The implementation is designed to validate its calculations against the **numerical examples provided in the research paper**.

Any discrepancies between the application results and the published examples should be identified and reported for further investigation.

## Technology Stack

| Technology    | Purpose                                       |
| ------------- | --------------------------------------------- |
| **Python**    | Core application and numerical implementation |
| **Streamlit** | Interactive web application                   |
| **NumPy**     | Matrix and numerical operations               |
| **Pandas**    | Data processing and tabular results           |
| **SciPy**     | Numerical and eigenvalue calculations         |
| **Plotly**    | Interactive visualizations                    |

## Application Structure

The application is organized into modular components for:

```text
AHP Calculator
├── 11 Matrix-Completion Methods
├── Matrix Validation
├── Consistency Calculations
├── Priority/Weight Calculation
├── Ranking
├── Visualization Dashboard
└── Testing & Validation
```

## Export Results

Users can export calculation results for further analysis in:

* **Excel**
* **CSV**

## Deployment

The application was deployed using **Google AI Studio**.

> **Note:** For the deployed application, use **Google Chrome**.

[Open the Deployed AHP Calculator](https://aistudio.google.com/apps/01782b1b-d42d-494e-9e45-976704c57287?showAssistant=true&showPreview=true)
