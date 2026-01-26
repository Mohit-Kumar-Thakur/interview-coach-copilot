def calculate_profile_score(user) -> int:
    """Calculate profile completeness score (0-100)"""
    score = 0
    
    if user.full_name:
        score += 25
    if user.college:
        score += 25
    if user.department:
        score += 25
    if user.graduation_year:
        score += 25
    
    # Clamp score to 0-100 range (defensive programming)
    return max(0, min(100, score))
