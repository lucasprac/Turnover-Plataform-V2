# Review: Cross-Efficiency Evaluation Method with Performance Level

## 1. Are we considering performance evaluation?
**No.** Currently, the project does **not** perform an "Efficiency/Performance Evaluation" in the sense described by the study.

The current system is a **Predictive System** (Machine Learning/XGBoost) focused on calculating the **Turnover Probability** (Risk of leaving). It uses employee attributes (Demographics, Contract info, Satisfaction scores) to predict a future event (Exit).

The study proposes an **Evaluative System** (DEA - Data Envelopment Analysis) focused on calculating **Efficiency Scores** (Ranking). It compares "Inputs" (Resources used by employee) vs "Outputs" (Results produced by employee) to determine how well they are performing relative to peers/goals.

## 2. How are we making the performance evaluate?
**We are not currently performing this type of evaluation.**

The closest metric we have is a feature engineering step called `M_Onboarding_Final_Score` in `backend/ml/preprocessing.py`.
- **Logic:** Weighted average of onboarding integration metrics (`(5 * Integration + 25 * 15d_Avg + 70 * 30d_Avg) / 100`).
- **Purpose:** This captures "how well the onboarding went", not "how efficient the employee is at their job daily".

We simply feed raw features (Salary, Age, Satisfaction) into XGBoost. The model learns correlation with Turnover, but it does *not* output a "Performance Score" or "Efficiency Rating".

## 3. Difference between current project vs. Study perspective

| Feature | **Current Project (Turnover Model)** | **Study Proposition (DEA Method)** |
| :--- | :--- | :--- |
| **Goal** | **Predict Future Risk** (Will they leave?) | **Evaluate Current State** (How efficient are they?) |
| **Method** | **Supervised Learning** (XGBoost) | **Mathematical Programming** (DEA / Linear Programming) |
| **Input Data** | Traits, Satisfaction, History | **Inputs** (Costs/Resources) vs **Outputs** (Results/Revenue) |
| **Logic** | Pattern Recognition (Non-linear correlations) | Optimization (Best Input/Output Ratio) |
| **Reference Point** | N/A (predicts probability 0-1) | **Management Objectives** (Personal vs Org Targets) |
| **Psychology** | Not explicitly modeled (features only) | **Bounded Rationality/Prospect Theory** (Loss aversion modeled via params $\alpha, \beta, \lambda$) |

The study introduces a sophisticated way to rank employees by considering that human decision-making is "bounded rational" (we perceive gains and losses differently relative to a goal), which is absent in our current raw feature approach.

## 4. How can we change our evaluation to follow the study?
To align with the study, we would need to build a **Performance Evaluation Module** alongside the Turnover Model. This new module would generate a "Performance Score" which could then be used as a *powerful input feature* for the Turnover Model (as high performers might have different turnover drivers than low performers).

### Implementation Steps:

1.  **Define Inputs & Outputs (The "DMU" Model)**
    We need to map our data to the DEA concept of "Resources" vs "Results".
    *   *Inputs (Costs):* `B11_salary_today_brl` (Salary), `B10_Tenure_in_month` (Time investment), Training Costs (if available).
    *   *Outputs (Results):* We currently **lack explicit output metrics** in the dataset like "Sales Generated" or "Tasks Completed".
        *   *Action:* We need to identify or simulate "Production/Result" columns. (e.g., `New Product Sales` from the study) or use `M_Onboarding_Final_Score` as a proxy for "Onboarding Success Output".

2.  **Define Management Objectives (Reference Points)**
    *   *Organizational Objective ($\theta^{OO}$):* Set a target efficiency (e.g., 0.8 or 80%).
    *   *Personal Objective ($\theta^{PO}$):* Set individual targets (e.g., improvement over last year).

3.  **Implement the Cross-Efficiency Algorithm**
    Create a new service (e.g., `backend/app/services/performance_evaluation.py`) that implements the linear programming models from the paper:
    *   Calculate **Self-Evaluation Efficiency** (CCR Model).
    *   Calculate **Prospect Values** (Gains/Losses) relative to the Objectives ($\theta^{OO}, \theta^{PO}$), using the Prospect Theory params ($\alpha=0.88, \beta=0.88, \lambda=2.25$).
    *   Compute the final **Cross-Efficiency Score**.

4.  **Integration**
    *   Run this evaluation periodically.
    *   Store the resulting `Performance_Score` in the database.
    *   Feed this `Performance_Score` into the **Turnover Prediction Model** (`ML Model`) as a new feature.
