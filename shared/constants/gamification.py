class GamificationConstants:
    # Appendix 7.2 — Gamification Scoring Model
    POINTS_LESSON_COMPLETED = 10
    POINTS_QUIZ_PASSED = 50
    POINTS_STREAK_DAY = 5
    POINTS_INCIDENT_REPORT_APPROVED = 25

    STREAK_MILESTONES = [7, 30, 100]

    # Level thresholds — cumulative points required to reach each level.
    # Index 0 = Level 1 floor, etc. Extend as needed.
    LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5200, 6600]

    @classmethod
    def level_for_points(cls, points: int) -> int:
        level = 1
        for i, threshold in enumerate(cls.LEVEL_THRESHOLDS):
            if points >= threshold:
                level = i + 1
        return level
