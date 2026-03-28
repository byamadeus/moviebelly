// Binary insertion algorithm for genre-based movie ranking.
// Pure TypeScript — no React, no Firestore imports.
//
// Mental model:
//   sortedList is indexed 0..N-1 where index 0 = current #1 (best) movie.
//   Binary search finds the index at which the new movie should be inserted.
//   getFinalRank() returns state.low + 1 (1-indexed).
//
//   Win  → new movie is better → it belongs in the upper (better) half → high = candidateIndex
//   Loss → new movie is worse  → it belongs in the lower (worse)  half → low  = candidateIndex + 1

export interface InsertionState {
  low: number;
  high: number;
  sortedList: { tmdbId: number; rank: number }[];
  dissimilarIds: Set<number>;   // tmdbIds the user marked "not alike" this session
  consecutiveSkips: number;     // tracks how many "not alike" taps in a row
}

/**
 * Initialize a binary insertion session for a genre.
 * sortedList must be sorted rank ASC (rank 1 first = best).
 * If sortedList is empty, low === high === 0 → immediate convergence → rank 1.
 */
export function initInsertion(
  sortedList: { tmdbId: number; rank: number }[]
): InsertionState {
  return {
    low: 0,
    high: sortedList.length,
    sortedList,
    dissimilarIds: new Set<number>(),
    consecutiveSkips: 0,
  };
}

/**
 * Returns the sortedList index to use as the next comparison candidate.
 * Scans outward from mid to find an index in [low, high) not in dissimilarIds.
 * Returns null when converged (low >= high) or all candidates are dissimilar.
 */
export function getCandidate(state: InsertionState): number | null {
  const { low, high, sortedList, dissimilarIds } = state;
  if (low >= high) return null;

  const mid = Math.floor((low + high) / 2);
  const maxRadius = Math.max(mid - low, high - 1 - mid);

  for (let radius = 0; radius <= maxRadius; radius++) {
    // Try mid - radius (left side of mid)
    const leftIdx = mid - radius;
    if (leftIdx >= low && leftIdx < high && !dissimilarIds.has(sortedList[leftIdx].tmdbId)) {
      return leftIdx;
    }
    // Try mid + radius (right side of mid, skip radius=0 to avoid double-checking mid)
    if (radius > 0) {
      const rightIdx = mid + radius;
      if (rightIdx >= low && rightIdx < high && !dissimilarIds.has(sortedList[rightIdx].tmdbId)) {
        return rightIdx;
      }
    }
  }

  // All indices in [low, high) are dissimilar — converge at current low
  return null;
}

/**
 * New movie won against sortedList[candidateIndex].
 * New movie is better → upper half: high = candidateIndex.
 */
export function applyWin(state: InsertionState, candidateIndex: number): InsertionState {
  return {
    ...state,
    high: candidateIndex,
    consecutiveSkips: 0,
  };
}

/**
 * New movie lost to sortedList[candidateIndex].
 * New movie is worse → lower half: low = candidateIndex + 1.
 */
export function applyLoss(state: InsertionState, candidateIndex: number): InsertionState {
  return {
    ...state,
    low: candidateIndex + 1,
    consecutiveSkips: 0,
  };
}

/**
 * User tapped "not alike" — no ranking information gained.
 * Marks the candidate as dissimilar and increments the skip counter.
 * low and high are unchanged; the binary search will find another candidate.
 */
export function applyNotAlike(state: InsertionState, candidateTmdbId: number): InsertionState {
  const newDissimilarIds = new Set(state.dissimilarIds);
  newDissimilarIds.add(candidateTmdbId);
  return {
    ...state,
    dissimilarIds: newDissimilarIds,
    consecutiveSkips: state.consecutiveSkips + 1,
  };
}

/**
 * Returns the 1-indexed final rank for the new movie.
 * Call only after getCandidate() returns null (converged).
 */
export function getFinalRank(state: InsertionState): number {
  return state.low + 1;
}

/**
 * Builds the complete updated rank list for all globally ranked movies
 * after inserting the new movie at insertRank.
 *
 * - New movie gets rank = insertRank
 * - All existing movies with rank >= insertRank get rank + 1 (shift down)
 * - All get totalRanked = sortedList.length + 1
 */
export function buildUpdatedRanks(
  sortedList: { tmdbId: number; rank: number }[],
  newTmdbId: number,
  insertRank: number
): { tmdbId: number; rank: number; totalRanked: number }[] {
  const total = sortedList.length + 1;

  const updated = sortedList.map((movie) => ({
    tmdbId: movie.tmdbId,
    rank: movie.rank >= insertRank ? movie.rank + 1 : movie.rank,
    totalRanked: total,
  }));

  updated.push({ tmdbId: newTmdbId, rank: insertRank, totalRanked: total });
  return updated;
}
