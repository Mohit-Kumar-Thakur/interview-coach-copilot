from typing import Dict, List

def evaluate_hr_answer(question: str, answer: str) -> Dict:
    """
    Rule-based HR rubric evaluator (Day 3).
    Later replace with LLM structured evaluation.
    """

    a = answer.strip()
    a_lower = a.lower()

    # Simple heuristics
    word_count = len(a.split())
    has_numbers = any(ch.isdigit() for ch in a)
    has_action_words = any(w in a_lower for w in ["built", "led", "created", "improved", "designed", "managed", "implemented"])
    has_result_words = any(w in a_lower for w in ["result", "impact", "increased", "reduced", "improved", "achieved", "delivered"])
    has_structure = any(w in a_lower for w in ["first", "then", "finally", "because", "so", "therefore"])

    # Rubric scoring (0–10 each)
    clarity = 5
    structure = 5
    relevance = 6
    impact = 5

    # Clarity
    if word_count >= 50:
        clarity += 2
    if word_count >= 90:
        clarity += 1
    if word_count < 20:
        clarity -= 2

    # Structure
    if has_structure:
        structure += 2
    if "i am" in a_lower or "my name" in a_lower:
        structure += 1

    # Relevance
    if "project" in a_lower or "intern" in a_lower or "experience" in a_lower:
        relevance += 2

    # Impact
    if has_action_words:
        impact += 2
    if has_numbers:
        impact += 2
    if has_result_words:
        impact += 2

    # Clamp 0–10
    def clamp(x: int) -> int:
        return max(0, min(10, x))

    clarity = clamp(clarity)
    structure = clamp(structure)
    relevance = clamp(relevance)
    impact = clamp(impact)

    score = round((clarity + structure + relevance + impact) / 4)

    strengths: List[str] = []
    improvements: List[str] = []

    if clarity >= 7:
        strengths.append("Clear explanation with good detail.")
    else:
        improvements.append("Improve clarity by being more specific and avoiding vague statements.")

    if structure >= 7:
        strengths.append("Good structure; answer flows logically.")
    else:
        improvements.append("Use a structured format (e.g., background → skills → projects → goal).")

    if relevance >= 8:
        strengths.append("Relevant points aligned with the interview question.")
    else:
        improvements.append("Mention role-relevant skills/projects more explicitly.")

    if impact >= 8:
        strengths.append("Strong impact demonstrated using actions/results.")
    else:
        improvements.append("Add measurable impact (numbers, outcomes, results).")

    ideal_answer = (
        "A strong answer should include: your current focus, key skills, 1–2 projects/experiences, "
        "measurable outcomes, and why you’re a fit for the role."
    )

    return {
        "score": score,
        "rubric": {
            "clarity": clarity,
            "structure": structure,
            "relevance": relevance,
            "impact": impact
        },
        "strengths": strengths,
        "improvements": improvements,
        "ideal_answer": ideal_answer
    }
