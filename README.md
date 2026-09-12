# AI-for-App-Building: AHP calculator for incomplete pairwise comparison matrices


Prompt with Gemini in Google AI Studio as  follows:

Act as an expert in **AHP, numerical methods, and web application development**.

Using the **attached research paper as the authoritative source (https://www.sciencedirect.com/science/article/pii/S2214716023000076)**, build an interactive calculator for **completing incomplete pairwise comparison matrices (PCMs)** using the **11 methods described in the paper**.

### Requirements

1. Extract and correctly implement all 11 methods exactly as presented in the paper.
2. Allow users to:

   * Enter an incomplete pairwise comparison matrix.
   * Automatically enforce reciprocal values and diagonal = 1.
   * Select one method or run all 11 methods.
3. For each method, calculate:

   * Completed matrix
   * Estimated missing comparisons
   * Priority/weight vector
   * λmax
   * CI
   * CR
   * Consistency status
4. Build a **visual dashboard** comparing all 11 methods, including:

   * CR comparison
   * Priority-weight comparison
   * Estimated missing-value comparison
   * Final ranking comparison
5. Highlight methods that pass/fail the CR threshold (default **CR ≤ 0.10**).
6. Validate the implementation against the **numerical examples in the paper** and report any discrepancies.
7. Provide clear error handling, calculation details, and warnings for invalid or insufficient input.
8. Allow results to be exported to **Excel/CSV**.

### Technology

Prefer **Python + Streamlit + NumPy + Pandas + SciPy + Plotly**.

Organize the code into modular components for the 11 methods, matrix validation, consistency calculations, dashboard, and tests.

**Important:** Do not substitute generic matrix-completion techniques for the 11 methods in the paper. Preserve the paper's equations, assumptions, and calculation procedures.

- Result deployed, use Google Chrome: 
  https://aistudio.google.com/apps/01782b1b-d42d-494e-9e45-976704c57287?showAssistant=true&showPreview=true
