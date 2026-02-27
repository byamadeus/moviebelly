// Elo rating system for MovieBeli
// Standard Elo with K-factor of 32 for responsive ranking

const DEFAULT_ELO = 1500;
const K_FACTOR = 32;

export function calculateExpectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function updateRatings(
  winnerElo: number,
  loserElo: number,
  kFactor: number = K_FACTOR
): { winnerNew: number; loserNew: number } {
  const expectedWinner = calculateExpectedScore(winnerElo, loserElo);
  const expectedLoser = calculateExpectedScore(loserElo, winnerElo);

  const winnerNew = Math.round(winnerElo + kFactor * (1 - expectedWinner));
  const loserNew = Math.round(loserElo + kFactor * (0 - expectedLoser));

  return { winnerNew, loserNew };
}

export { DEFAULT_ELO, K_FACTOR };
