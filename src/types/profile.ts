// Core data types for MovieBeli user profiles and movie ratings

export interface UserProfile {
  id: string;
  createdAt: number;
  lastUpdated: number;
  moviesSeen: RatedMovie[];
  comparisons: Comparison[];
  customGenres: string[];
}

export interface RatedMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  overview: string;
  tmdbGenreIds: number[];
  userGenres: string[];         // Custom user-applied tags (freeform + TMDB names)
  eloRatings: GenreEloRating[];
  addedAt: number;
  lastComparedAt: number;
}

export interface GenreEloRating {
  genreKey: string;             // Normalized: TMDB genre name or custom tag (lowercased)
  genreLabel: string;           // Display name
  eloScore: number;             // Default: 1500
  comparisons: number;
  wins: number;
  losses: number;
}

export interface Comparison {
  id: string;
  timestamp: number;
  genreContext: string;         // Genre key this comparison was made within
  winnerTmdbId: number;
  loserTmdbId: number;
  winnerNewElo: number;
  loserNewElo: number;
}

export interface GenreStats {
  genreKey: string;
  genreLabel: string;
  movieCount: number;
  totalComparisons: number;
  topMovies: GenreRankedMovie[];
}

export interface GenreRankedMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  eloScore: number;
  comparisons: number;
  rank: number;
}

export interface MoviePlacement {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  genreKey: string;
  genreLabel: string;
  rank: number;
  total: number;
  eloScore: number;
}
