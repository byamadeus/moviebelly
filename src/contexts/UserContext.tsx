import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type {
  RatedMovie,
  WatchlistItem,
  MoviePlacement,
  Comparison,
} from '../types/profile';
import {
  getRatedMovies,
  addRatedMovie as firestoreAddRatedMovie,
  saveComparison as firestoreSaveComparison,
  updateGlobalRanks as firestoreUpdateGlobalRanks,
  addToWatchlist as firestoreAddToWatchlist,
  removeFromWatchlist as firestoreRemoveFromWatchlist,
  addCustomGenre as firestoreAddCustomGenre,
  resetProfile as firestoreResetProfile,
  computeGlobalRankings,
  computeMoviePlacement,
} from '../services/firestore';
import { useAuth } from './AuthContext';

interface UserContextValue {
  movies: RatedMovie[];
  loading: boolean;
  // Watchlist (derived from AuthContext profile)
  watchlist: WatchlistItem[];
  addToWatchlist: (item: WatchlistItem) => Promise<void>;
  removeFromWatchlist: (tmdbId: number) => Promise<void>;
  isOnWatchlist: (tmdbId: number) => boolean;
  // Movie operations
  addRatedMovie: (movie: RatedMovie) => Promise<void>;
  isMovieSeen: (tmdbId: number) => boolean;
  isMovieRanked: (tmdbId: number) => boolean;
  // Global ranking operations
  recordComparison: (comparison: Omit<Comparison, 'id' | 'timestamp'>) => Promise<void>;
  updateGlobalRanks: (rankedMovies: { tmdbId: number; rank: number; totalRanked: number }[]) => Promise<void>;
  getRankedMovies: () => RatedMovie[];
  getMoviePlacement: (tmdbId: number) => MoviePlacement | null;
  // Dev / misc
  addCustomGenre: (genreName: string) => Promise<void>;
  resetProfile: () => Promise<void>;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const { firebaseUser, profile, refreshProfile } = useAuth();
  const [movies, setMovies] = useState<RatedMovie[]>([]);
  const [loading, setLoading] = useState(true);

  // Load movies when user changes
  useEffect(() => {
    if (!firebaseUser) {
      setMovies([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    getRatedMovies(firebaseUser.uid)
      .then(setMovies)
      .finally(() => setLoading(false));
  }, [firebaseUser]);

  // ── Watchlist ────────────────────────────────────────────────────────────────

  const watchlist = profile?.watchlist ?? [];

  const addToWatchlist = useCallback(
    async (item: WatchlistItem) => {
      if (!firebaseUser) return;
      await firestoreAddToWatchlist(firebaseUser.uid, item);
      await refreshProfile();
    },
    [firebaseUser, refreshProfile]
  );

  const removeFromWatchlist = useCallback(
    async (tmdbId: number) => {
      if (!firebaseUser) return;
      await firestoreRemoveFromWatchlist(firebaseUser.uid, tmdbId);
      await refreshProfile();
    },
    [firebaseUser, refreshProfile]
  );

  const isOnWatchlist = useCallback(
    (tmdbId: number) => watchlist.some((w) => w.tmdbId === tmdbId),
    [watchlist]
  );

  // ── Movie operations ──────────────────────────────────────────────────────────

  const addRatedMovie = useCallback(
    async (movie: RatedMovie) => {
      if (!firebaseUser) return;
      const exists = movies.some((m) => m.tmdbId === movie.tmdbId);
      if (exists) return;
      await firestoreAddRatedMovie(firebaseUser.uid, movie);
      setMovies((prev) => [...prev, movie]);
    },
    [firebaseUser, movies]
  );

  const isMovieSeen = useCallback(
    (tmdbId: number) =>
      movies.some((m) => m.tmdbId === tmdbId) || watchlist.some((w) => w.tmdbId === tmdbId),
    [movies, watchlist]
  );

  const isMovieRanked = useCallback(
    (tmdbId: number) => movies.some((m) => m.tmdbId === tmdbId && m.rank > 0),
    [movies]
  );

  // ── Global ranking operations ─────────────────────────────────────────────────

  const recordComparison = useCallback(
    async (comparison: Omit<Comparison, 'id' | 'timestamp'>) => {
      if (!firebaseUser) return;
      await firestoreSaveComparison(firebaseUser.uid, comparison);
    },
    [firebaseUser]
  );

  const doUpdateGlobalRanks = useCallback(
    async (rankedMovies: { tmdbId: number; rank: number; totalRanked: number }[]) => {
      if (!firebaseUser) return;
      await firestoreUpdateGlobalRanks(firebaseUser.uid, rankedMovies);

      const now = Date.now();
      setMovies((prev) =>
        prev.map((movie) => {
          const update = rankedMovies.find((r) => r.tmdbId === movie.tmdbId);
          if (!update) return movie;
          return {
            ...movie,
            rank: update.rank,
            totalRanked: update.totalRanked,
            placedAt: now,
            placementHistory: [
              ...(movie.placementHistory ?? []),
              { rank: update.rank, totalRanked: update.totalRanked, placedAt: now },
            ],
            lastUpdatedAt: now,
          };
        })
      );
    },
    [firebaseUser]
  );

  const getRankedMovies = useCallback(
    (): RatedMovie[] => computeGlobalRankings(movies),
    [movies]
  );

  const getMoviePlacement = useCallback(
    (tmdbId: number): MoviePlacement | null => computeMoviePlacement(movies, tmdbId),
    [movies]
  );

  // ── Dev / misc ────────────────────────────────────────────────────────────────

  const addCustomGenre = useCallback(
    async (genreName: string) => {
      if (!firebaseUser) return;
      await firestoreAddCustomGenre(firebaseUser.uid, genreName);
    },
    [firebaseUser]
  );

  const resetProfile = useCallback(async () => {
    if (!firebaseUser) return;
    await firestoreResetProfile(firebaseUser.uid);
    setMovies([]);
    await refreshProfile();
  }, [firebaseUser, refreshProfile]);

  return (
    <UserContext.Provider
      value={{
        movies,
        loading,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        isOnWatchlist,
        addRatedMovie,
        isMovieSeen,
        isMovieRanked,
        recordComparison,
        updateGlobalRanks: doUpdateGlobalRanks,
        getRankedMovies,
        getMoviePlacement,
        addCustomGenre,
        resetProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
