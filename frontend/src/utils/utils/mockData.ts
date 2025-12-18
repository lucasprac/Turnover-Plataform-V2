// Mock data que simula a resposta da sua API de People Analytics
export function getMockData() {
  return {
    metrics: {
      model_accuracy: 0.87,
      precision: 0.82,
      recall: 0.79,
      f1_score: 0.805,
      total_predictions: 245,
      high_risk_count: 32
    },
    shap_values: [
      { feature: 'Tempo de Empresa', value: 0.245, base_value: 0.5 },
      { feature: 'Satisfação no Trabalho', value: -0.189, base_value: 0.5 },
      { feature: 'Salário', value: -0.156, base_value: 0.5 },
      { feature: 'Horas Trabalhadas/Semana', value: 0.134, base_value: 0.5 },
      { feature: 'Promoções (últimos 5 anos)', value: -0.112, base_value: 0.5 },
      { feature: 'Distância de Casa', value: 0.098, base_value: 0.5 },
      { feature: 'Nível de Responsabilidade', value: -0.087, base_value: 0.5 },
      { feature: 'Idade', value: -0.076, base_value: 0.5 },
      { feature: 'Equilíbrio Vida/Trabalho', value: -0.065, base_value: 0.5 },
      { feature: 'Performance Rating', value: -0.054, base_value: 0.5 },
      { feature: 'Treinamentos Concluídos', value: -0.043, base_value: 0.5 },
      { feature: 'Relação com Gestor', value: -0.038, base_value: 0.5 }
    ],
    feature_importance: [
      { feature: 'Tempo de Empresa', importance: 0.18 },
      { feature: 'Satisfação no Trabalho', importance: 0.16 },
      { feature: 'Salário', importance: 0.14 },
      { feature: 'Horas Trabalhadas/Semana', importance: 0.11 },
      { feature: 'Promoções (últimos 5 anos)', importance: 0.09 },
      { feature: 'Distância de Casa', importance: 0.08 },
      { feature: 'Nível de Responsabilidade', importance: 0.07 },
      { feature: 'Idade', importance: 0.06 },
      { feature: 'Equilíbrio Vida/Trabalho', importance: 0.05 },
      { feature: 'Performance Rating', importance: 0.04 },
      { feature: 'Treinamentos Concluídos', importance: 0.02 }
    ],
    predictions: [
      { employee_id: 'EMP001', predicted_value: 0.85, confidence: 0.92, risk_level: 'high' as const },
      { employee_id: 'EMP002', predicted_value: 0.72, confidence: 0.88, risk_level: 'high' as const },
      { employee_id: 'EMP003', predicted_value: 0.68, confidence: 0.85, risk_level: 'medium' as const },
      { employee_id: 'EMP004', predicted_value: 0.55, confidence: 0.78, risk_level: 'medium' as const },
      { employee_id: 'EMP005', predicted_value: 0.48, confidence: 0.91, risk_level: 'medium' as const },
      { employee_id: 'EMP006', predicted_value: 0.35, confidence: 0.87, risk_level: 'low' as const },
      { employee_id: 'EMP007', predicted_value: 0.28, confidence: 0.93, risk_level: 'low' as const },
      { employee_id: 'EMP008', predicted_value: 0.82, confidence: 0.76, risk_level: 'high' as const },
      { employee_id: 'EMP009', predicted_value: 0.15, confidence: 0.89, risk_level: 'low' as const },
      { employee_id: 'EMP010', predicted_value: 0.63, confidence: 0.82, risk_level: 'medium' as const },
      { employee_id: 'EMP011', predicted_value: 0.91, confidence: 0.95, risk_level: 'high' as const },
      { employee_id: 'EMP012', predicted_value: 0.22, confidence: 0.86, risk_level: 'low' as const },
      { employee_id: 'EMP013', predicted_value: 0.45, confidence: 0.79, risk_level: 'medium' as const },
      { employee_id: 'EMP014', predicted_value: 0.77, confidence: 0.88, risk_level: 'high' as const },
      { employee_id: 'EMP015', predicted_value: 0.12, confidence: 0.92, risk_level: 'low' as const },
      { employee_id: 'EMP016', predicted_value: 0.58, confidence: 0.84, risk_level: 'medium' as const },
      { employee_id: 'EMP017', predicted_value: 0.33, confidence: 0.90, risk_level: 'low' as const },
      { employee_id: 'EMP018', predicted_value: 0.69, confidence: 0.81, risk_level: 'medium' as const },
      { employee_id: 'EMP019', predicted_value: 0.88, confidence: 0.94, risk_level: 'high' as const },
      { employee_id: 'EMP020', predicted_value: 0.19, confidence: 0.88, risk_level: 'low' as const }
    ],
    turnover_analysis: [
      { month: 'Jan', predicted_turnover: 12.5, historical_turnover: 11.8, confidence_lower: 10.2, confidence_upper: 14.8 },
      { month: 'Fev', predicted_turnover: 13.2, historical_turnover: 12.1, confidence_lower: 11.0, confidence_upper: 15.4 },
      { month: 'Mar', predicted_turnover: 14.1, historical_turnover: 13.5, confidence_lower: 12.1, confidence_upper: 16.1 },
      { month: 'Abr', predicted_turnover: 15.8, historical_turnover: 14.2, confidence_lower: 13.5, confidence_upper: 18.1 },
      { month: 'Mai', predicted_turnover: 16.5, historical_turnover: 15.1, confidence_lower: 14.2, confidence_upper: 18.8 },
      { month: 'Jun', predicted_turnover: 17.2, historical_turnover: 16.8, confidence_lower: 15.0, confidence_upper: 19.4 },
      { month: 'Jul', predicted_turnover: 16.8, historical_turnover: 15.9, confidence_lower: 14.6, confidence_upper: 19.0 },
      { month: 'Ago', predicted_turnover: 15.5, historical_turnover: 14.7, confidence_lower: 13.3, confidence_upper: 17.7 },
      { month: 'Set', predicted_turnover: 14.2, historical_turnover: 13.8, confidence_lower: 12.0, confidence_upper: 16.4 },
      { month: 'Out', predicted_turnover: 13.8, historical_turnover: 13.2, confidence_lower: 11.6, confidence_upper: 16.0 },
      { month: 'Nov', predicted_turnover: 13.1, historical_turnover: 12.5, confidence_lower: 10.9, confidence_upper: 15.3 },
      { month: 'Dez', predicted_turnover: 12.9, historical_turnover: 12.3, confidence_lower: 10.7, confidence_upper: 15.1 }
    ]
  };
}
