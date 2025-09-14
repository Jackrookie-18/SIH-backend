// backend/ai.ts

/**
 * Evaluates athlete stats and assigns a performance category.
 * This is a simplified AI logic model.
 *
 * @param height - Athlete's height in cm.
 * @param weight - Athlete's weight in kg.
 * @param strength - Athlete's strength score (e.g., a composite score from 1-100).
 * @returns A category: "Average", "Above Average", or "Excellent".
 */
export function categorizeAthlete(
    height: number,
    weight: number,
    strength: number
): 'Average' | 'Above Average' | 'Excellent' {
    // Define baseline scores for an "Average" athlete
    const avgHeight = 180; // cm
    const avgWeight = 85; // kg
    const avgStrength = 60; // 1-100 scale

    // Calculate a total score based on deviation from average
    // This is a simple weighted score.
    const heightScore = (height / avgHeight) * 30;
    const weightScore = (weight / avgWeight) * 30;
    const strengthScore = (strength / avgStrength) * 40;

    const totalScore = heightScore + weightScore + strengthScore;

    // Categorize based on the total score
    if (totalScore >= 115) {
        return 'Excellent';
    }
    if (totalScore >= 100) {
        return 'Above Average';
    }
    return 'Average';
}
