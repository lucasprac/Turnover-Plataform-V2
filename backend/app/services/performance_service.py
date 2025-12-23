import numpy as np
import pandas as pd
from scipy.optimize import linprog, minimize
from typing import List, Dict, Any, Tuple
from backend.app.services.prediction_service import load_data

# --- Constants for Prospect Theory ---
# From Study Section 3.4
ALPHA = 0.88
BETA = 0.88
LAMBDA = 2.25

class PerformanceEvaluator:
    def __init__(self):
        self.df = None
        self.input_cols = ['B10_Tenure_in_month', 'B11_salary_today_brl', 'b1_PDI_rate']
        self.output_cols = ['c1_overall_employee_satisfaction', 'M_eNPS', 'B9_salary_increase_last_year']
        self.progress = 0.0 # 0.0 to 1.0
        self.is_running = False

    def load_dataset(self, input_cols: List[str] = None, output_cols: List[str] = None):
        self.df = load_data()
        
        # Default columns if not provided
        if input_cols: self.input_cols = input_cols
        if output_cols: self.output_cols = output_cols
        
        epsilon = 0.001
        for col in self.input_cols + self.output_cols:
            if col in self.df.columns:
                # Ensure data is numeric
                self.df[col] = pd.to_numeric(self.df[col], errors='coerce').fillna(0)
                self.df[col] = self.df[col].apply(lambda x: max(epsilon, x))

    def get_available_columns(self) -> List[str]:
        if self.df is None: self.load_dataset()
        # Return only numeric columns for selection
        return self.df.select_dtypes(include=[np.number]).columns.tolist()

    def _get_matrices(self, input_cols: List[str] = None, output_cols: List[str] = None) -> Tuple[np.ndarray, np.ndarray]:
        if self.df is None: self.load_dataset(input_cols, output_cols)
        
        inputs = input_cols if input_cols else self.input_cols
        outputs = output_cols if output_cols else self.output_cols
        
        X = self.df[inputs].values.T # Shape (m, n)
        Y = self.df[outputs].values.T # Shape (s, n)
        return X, Y

    def solve_ccr_model(self, dmu_index: int, X: np.ndarray, Y: np.ndarray, A_ub_prebuilt: np.ndarray, b_ub_prebuilt: np.ndarray) -> Dict:
        """
        Solves CCR model for a specific DMU using pre-built matrices.
        """
        m, n = X.shape
        s, n_y = Y.shape
        x_k = X[:, dmu_index]
        y_k = Y[:, dmu_index]
        
        c = np.concatenate([-y_k, np.zeros(m)])
        A_eq = np.array([np.concatenate([np.zeros(s), x_k])])
        b_eq = np.array([1])
        
        epsilon = 1e-6
        bounds = [(epsilon, None) for _ in range(s + m)]
        
        res = linprog(c, A_ub=A_ub_prebuilt, b_ub=b_ub_prebuilt, A_eq=A_eq, b_eq=b_eq, bounds=bounds, method='highs')
        
        if res.success:
            return {
                'efficiency': -res.fun,
                'u': res.x[:s],
                'v': res.x[s:]
            }
        return {'efficiency': 0.0, 'u': np.zeros(s), 'v': np.zeros(m)}

    def calculate_cross_efficiency_matrix_vectorized(self, u_matrix: np.ndarray, v_matrix: np.ndarray, X: np.ndarray, Y: np.ndarray) -> np.ndarray:
        weighted_outputs = np.matmul(u_matrix, Y)
        weighted_inputs = np.matmul(v_matrix, X)
        weighted_inputs[weighted_inputs <= 0] = 1e-9
        return weighted_outputs / weighted_inputs

    def solve_secondary_objective(self, k: int, X: np.ndarray, Y: np.ndarray, theta_kk: float, target: float, objective_type: str) -> Dict:
        """
        Solves a secondary objective for Cross-Efficiency (Models 6 or 7).
        Guided by Bounded Rationality (Prospect Theory).
        """
        m, n = X.shape
        s, _ = Y.shape
        x_k = X[:, k]
        y_k = Y[:, k]

        def objective(weights):
            u = weights[:s]
            v = weights[s:]
            weighted_outputs = np.dot(u, Y)
            weighted_inputs = np.dot(v, X)
            efficiencies = weighted_outputs / (weighted_inputs + 1e-9)
            delta = efficiencies - target
            v_values = np.where(delta >= 0, delta ** ALPHA, -LAMBDA * ((-delta) ** BETA))
            
            if objective_type == 'OO':
                return -np.sum(v_values)
            else:
                return -np.sum(v_values * (efficiencies > target))

        def constr_v_x(weights): return np.dot(weights[s:], x_k) - 1
        def constr_u_y(weights): return np.dot(weights[:s], y_k) - theta_kk
        def constr_efficiency(weights): return weights[s:].dot(X) - weights[:s].dot(Y)

        constraints = [
            {'type': 'eq', 'fun': constr_v_x},
            {'type': 'eq', 'fun': constr_u_y},
            {'type': 'ineq', 'fun': constr_efficiency}
        ]
        
        epsilon = 1e-6
        bounds = [(epsilon, None) for _ in range(s + m)]
        initial_guess = np.ones(s + m) * 0.5
        
        res = minimize(objective, initial_guess, method='SLSQP', bounds=bounds, constraints=constraints, options={'maxiter': 50})
        if res.success:
            return {'u': res.x[:s], 'v': res.x[s:]}
        return None

    def evaluate_performance(self, 
                             input_cols: List[str] = None, 
                             output_cols: List[str] = None,
                             organizational_objective: float = 0.8, 
                             personal_objective: float = 0.9, 
                             management_objective: float = 0.7) -> List[Dict]:
        self.is_running = True
        self.progress = 0.0
        
        if self.df is None or input_cols or output_cols:
            self.load_dataset(input_cols, output_cols)
            
        X, Y = self._get_matrices(input_cols, output_cols)
        ids = self.df['id'].tolist()
        n = len(ids)
        
        A_ub_prebuilt = np.hstack([Y.T, -X.T])
        b_ub_prebuilt = np.zeros(n)
        ccr_results = []
        for k in range(n):
            ccr_results.append(self.solve_ccr_model(k, X, Y, A_ub_prebuilt, b_ub_prebuilt))
            if k % 100 == 0: self.progress = (k / n) * 0.3
            
        self_efficiencies = [r['efficiency'] for r in ccr_results]
        
        subset_size = min(50, n)
        evaluator_indices = np.random.choice(n, subset_size, replace=False)
        
        u_oo_list, v_oo_list = [], []
        u_po_list, v_po_list = [], []
        u_mo_list, v_mo_list = [], []

        for i, k in enumerate(evaluator_indices):
            theta_kk = self_efficiencies[k]
            res_oo = self.solve_secondary_objective(k, X, Y, theta_kk, organizational_objective, 'OO')
            if res_oo: u_oo_list.append(res_oo['u']); v_oo_list.append(res_oo['v'])
            
            res_po = self.solve_secondary_objective(k, X, Y, theta_kk, personal_objective, 'PO')
            if res_po: u_po_list.append(res_po['u']); v_po_list.append(res_po['v'])

            res_mo = self.solve_secondary_objective(k, X, Y, theta_kk, management_objective, 'OO')
            if res_mo: u_mo_list.append(res_mo['u']); v_mo_list.append(res_mo['v'])
                
            self.progress = 0.3 + (i / subset_size) * 0.6

        def get_avg_cross(u_list, v_list):
            if not u_list: return np.mean(self_efficiencies) * np.ones(n)
            E = self.calculate_cross_efficiency_matrix_vectorized(np.array(u_list), np.array(v_list), X, Y)
            return np.mean(E, axis=0)

        avg_oo = get_avg_cross(u_oo_list, v_oo_list)
        avg_po = get_avg_cross(u_po_list, v_po_list)
        avg_mo = get_avg_cross(u_mo_list, v_mo_list)
        
        results = []
        for i, emp_id in enumerate(ids):
            composite = (avg_oo[i] + avg_po[i] + avg_mo[i]) / 3
            results.append({
                "employee_id": emp_id,
                "ccr_efficiency": float(round(self_efficiencies[i], 4)),
                "cross_efficiency": float(round(avg_oo[i], 4)),
                "prospect_organizational": float(round(avg_oo[i], 4)),
                "prospect_personal": float(round(avg_po[i], 4)),
                "prospect_management": float(round(avg_mo[i], 4)),
                "composite_score": float(round(composite, 4))
            })
            
        self.progress = 1.0
        self.is_running = False
        return results

evaluator = PerformanceEvaluator()

evaluator = PerformanceEvaluator()
