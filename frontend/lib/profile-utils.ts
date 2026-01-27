/**
 * Profile score utility functions
 * Centralized logic for profile score styling and messages
 */

export type ProfileScoreStyle = {
    background: string;
    color: string;
    borderColor: string;
};

/**
 * Get consistent styling for profile score based on score value
 * @param score - Profile score (0-100)
 * @returns Style object with background, color, and borderColor
 */
export function getProfileScoreStyle(score: number): ProfileScoreStyle {
    if (score < 40) {
        return {
            background: 'rgb(var(--danger) / 0.1)',
            color: 'rgb(var(--danger))',
            borderColor: 'rgb(var(--danger) / 0.3)',
        };
    }

    if (score < 71) {
        return {
            background: 'rgb(var(--primary-muted) / 0.1)',
            color: 'rgb(var(--primary-muted))',
            borderColor: 'rgb(var(--primary-muted) / 0.3)',
        };
    }

    return {
        background: 'rgb(var(--primary) / 0.1)',
        color: 'rgb(var(--primary))',
        borderColor: 'rgb(var(--primary) / 0.3)',
    };
}

/**
 * Get progress bar color based on score value
 * @param score - Profile score (0-100)
 * @returns CSS color string for progress bar
 */
export function getProfileScoreProgressColor(score: number): string {
    if (score < 40) {
        return 'rgb(var(--danger))';
    }

    if (score < 71) {
        return 'rgb(var(--primary-muted))';
    }

    return 'rgb(var(--primary))';
}

/**
 * Get profile completion message based on score
 * @param score - Profile score (0-100)
 * @returns Message string
 */
export function getProfileScoreMessage(score: number): string {
    if (score === 100) {
        return '✓ Profile complete!';
    }

    const fieldsNeeded = Math.ceil((100 - score) / 25);
    const fieldWord = fieldsNeeded === 1 ? 'field' : 'fields';

    return `Fill in ${fieldsNeeded} more ${fieldWord} to complete your profile`;
}
