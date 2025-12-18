from enum import Enum
from typing import Dict, List

class MotivationDimension(Enum):
    AMOTIVATION = "Desmotivação"
    EXT_REG_SOCIAL = "Regulação Extrínseca Social"
    EXT_REG_MATERIAL = "Regulação Extrínseca Material"
    INTROJECTED = "Regulação Introjetada"
    IDENTIFIED = "Regulação Identificada"
    INTRINSIC = "Regulação Intrínseca"

# Mapping from Image
# Questions are 1-based index
QUESTION_MAPPING: Dict[MotivationDimension, List[int]] = {
    MotivationDimension.AMOTIVATION: [1, 2, 3],
    MotivationDimension.EXT_REG_SOCIAL: [4, 5, 6],
    MotivationDimension.EXT_REG_MATERIAL: [7, 8, 9],
    MotivationDimension.INTROJECTED: [10, 11, 12, 13],
    MotivationDimension.IDENTIFIED: [14, 15, 16],
    MotivationDimension.INTRINSIC: [17, 18, 19]
}

def calculate_dimension_scores(answers: Dict[int, int]) -> Dict[str, float]:
    """
    Calculates the mean score for each motivation dimension based on 1-19 answers.
    Answers should be a dict of {question_id: score}.
    """
    scores = {}
    for dimension, q_ids in QUESTION_MAPPING.items():
        dim_scores = [answers.get(q_id) for q_id in q_ids if answers.get(q_id) is not None]
        if dim_scores:
            scores[dimension.value] = sum(dim_scores) / len(dim_scores)
        else:
            scores[dimension.value] = None
    return scores
