// Core data types for MovieBeli
// Matches Firestore schema: /users/{uid}, /users/{uid}/movies/{tmdbId}, /users/{uid}/comparisons/{id}

// ─── User Profile (/users/{uid}) ───────────────────────────────────────────────

export interface UserProfile {
  id: string;                        // Firebase Auth UID
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: number;
  lastUpdated: number;
  friendIds: string[];               // Firebase UIDs of connected friends
  visibility: 'friends' | 'public'; // Profile visibility (friends-only default)
  customGenres: string[];            // User-created genre/vibe labels (kept for future use)
  movieCount: number;                // Denormalized count for stats display
  comparisonCount: number;           // Denormalized count for stats display
  watchlist: WatchlistItem[];        // Movies saved for later
}

// ─── Watchlist ─────────────────────────────────────────────────────────────────

export interface WatchlistItem {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  addedAt: number;
}

// ─── Rated Movie (/users/{uid}/movies/{tmdbId}) ─────────────────────────────

export interface RatedMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  overview: string;
  tmdbGenreIds: number[];            // TMDB's genre IDs (metadata only, not ranking context)
  tmdbGenreNames: string[];          // TMDB genre display names (for By Genre tab, no extra API calls)
  addedAt: number;
  lastUpdatedAt: number;
  // Global rank fields (replace ratingContexts)
  rank: number;                      // Global rank across all movies (0 = unranked/in progress)
  totalRanked: number;               // Total globally ranked movies at time of placement
  placedAt: number;                  // Timestamp of last placement
  placementHistory: PlacementRecord[]; // Non-destructive history of all placements
}

export interface PlacementRecord {
  rank: number;
  totalRanked: number;
  placedAt: number;
}

// ─── Comparison (/users/{uid}/comparisons/{id}) ──────────────────────────────

export interface Comparison {
  id: string;
  timestamp: number;
  movieAId: number;
  movieBId: number;
  winnerId: number | null;           // null = dissimilarity signal or skip
  isDissimilarSignal: boolean;       // True when user tapped "Too Different" (records signal)
  isSkip: boolean;                   // True when user tapped "Skip →" (no data recorded)
}

// ─── Derived / Computed Types ─────────────────────────────────────────────────

// Result after binary insertion completes
export interface MoviePlacement {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  rank: number;
  total: number;
}
