---
description: CCR/CrossEfcincy considering the Prospective Theory
---

1. **Data preparation**
    - Define a set of DMUs with common input and output variables.
    - Clean invalid records.
    - Treat collinearity (remove redundant variables).
    - Ensure all DEA variables are positive (transform or standardize if needed).[^1]
2. **CCR efficiency (self‑evaluation)**
    - For each DMU $k$, define a Linear Programming (CCR multiplier) model:
        - Decision variables: output weights $u_r$, input weights $v_i$.
        - Objective: maximize $\theta_{kk} = \sum_r u_r y_{rk}$.
        - Constraint: $\sum_i v_i x_{ik} = 1$.
        - Constraints: $\sum_r u_r y_{rj} - \sum_i v_i x_{ij} \le 0$ for all $j$.
        - Non‑negativity: $u_r, v_i \ge \varepsilon$.
    - Solve the LP for each $k$; record $\theta_{kk}$ and optimal $u_{rk}, v_{ik}$ as the CCR efficiency and self‑weights.[^1]
3. **Classical cross‑efficiency matrix**
    - For each ordered pair $(j, k)$:
        - Use $u_{rk}, v_{ik}$ (optimal for $k$) to compute $\theta_{jk}$.
    - Arrange $\theta_{jk}$ in a matrix: rows = evaluated DMUs $j$, columns = evaluating DMUs $k$.
    - For each $j$, compute the average of $\theta_{jk}$ across all $k$ as its classical cross‑efficiency score.[^1]
4. **Define performance level as management objective**
    - Interpret DEA efficiency (CCR or cross‑efficiency) as performance level in $[0, 1]$.
    - Use this performance level as Management Objective (MO), consistent with SMART principles.
    - Specify three types of objectives:
        - Organizational Objective (OO): common target for all DMUs.
        - Personal Objective (PO): individual target per DMU.
        - Composite Objective (CO): weighted combination of OO and PO (e.g., CO = $\omega$·OO + (1−$\omega$)·PO).[^1]
5. **Prospect Theory setup**
    - Adopt a two‑branch value function $v(z)$:
        - Gain domain $z \ge 0$: $v(z) = z^\alpha$.
        - Loss domain $z < 0$: $v(z) = -\lambda (-z)^\beta$.
    - Use empirically grounded parameters (e.g., $\alpha = \beta = 0.88$, $\lambda = 2.25$).
    - Interpret MO (OO or PO) as the reference point for gains and losses.[^2][^1]
6. **Gain/loss measurement relative to an objective**
    - For each DMU $j$ and management objective MO:
        - If efficiency$_j$ < MO, define input redundancies and output shortfalls $(x_j, y_j)$ needed to reach MO (loss case).
        - If efficiency$_j$ ≥ MO, define input savings and output surpluses $(x_j, y_j)$ relative to MO (gain case).
    - Use these deviations in the Prospect value function to compute:
        - Loss value $S^1_{kj}$ when below MO.
        - Gain value $S^2_{kj}$ when above MO.[^1]
7. **Cross‑efficiency under Organizational Objectives (OO)**
    - Choose a set of OO values within $[0, 1]$.
    - For each evaluator $k$ and evaluatee $j$:
        - Compare efficiency$_j$ with OO.
        - If OO ≤ efficiency$_j$, formulate Model 6 (gain case):
            - Objective: minimize $S^1_{kj}$.
            - Constraints:
                - OO as reference in the performance constraints for $j$.
                - Preserve or respect CCR efficiency of $k$.
                - Standard DEA feasibility constraints for all DMUs under weights of $k$.
        - If OO > efficiency$_j$, formulate Model 7 (loss case):
            - Objective: maximize $S^2_{kj}$.
            - Same DEA structure; loss‑type deviation variables instead of gain‑type.[^1]
    - Solve Models 6/7 for all $(k, j)$.
    - From optimal weights, compute cross‑efficiency scores for each DMU under each OO.
    - Aggregate self‑evaluation and peer evaluations into a final cross‑efficiency per DMU per OO.[^1]
8. **Cross‑efficiency under Personal Objectives (PO)**
    - Assign each DMU $k$ a set of PO values in $[0, 1]$.
    - For each PO and DMUk:
        - Compare efficiency$_k$ with PO.
        - If PO ≤ efficiency$_k$, formulate Model 8 (gain case for $k$):
            - Objective: maximize k’s prospect gain $S^1_k$.
            - Constraints: PO as reference point; maintain k’s CCR efficiency; standard DEA constraints for all DMUs under k’s weights.
        - If PO > efficiency$_k$, formulate Model 9 (loss case for $k$):
            - Objective: minimize k’s prospect loss $S^2_k$.
            - Similar constraints with loss‑type deviations.[^1]
    - Solve Models 8/9 for all POs and DMUs.
    - Use the resulting weights to generate cross‑efficiency scores under each PO.
    - For each PO, compute the cross‑efficiency of each DMU via averaging across evaluators.[^1]
9. **Cross‑efficiency under Composite Objectives (CO)**
    - Choose a weight $\omega \in [0,1]$ representing the importance of OO vs PO.
    - For each DMU, combine cross‑efficiency under OO and under PO:
        - CrossEff$_{CO} = \omega \cdot$CrossEff$_{OO} + (1 - \omega)\cdot$CrossEff$_{PO}$.
    - Repeat for multiple CO values if needed.
    - Summarize cross‑efficiency scores per DMU under each CO.[^1]
10. **Comparison and interpretation**

- Compare DMU rankings under:
    - CCR efficiencies (self‑evaluation only).
    - Classical cross‑efficiency.
    - Cross‑efficiency under OO, PO, and CO with Prospect Theory.
- Analyze:
    - Stability of fully efficient DMUs.
    - Ranking sensitivity of inefficient DMUs to changes in OO/PO/CO.
    - The impact of bounded rationality (via Prospect Theory) on how losses below targets and gains above targets are reflected in cross‑efficiency scores.[^3][^1]