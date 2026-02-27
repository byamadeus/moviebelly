import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { UserProfile, RatedMovie, GenreStats, GenreRankedMovie, MoviePlacement } from '../types/profile';
import * as storage from '../services/storage';
import { updateRatings } from '../services/elo';
import { createSeedProfile } from '../data/seedProfile';

interface UserContextValue {
  profile: UserProfile | null;
  loading: boolean;
  addRatedMovie: (movie: RatedMovie) => void;
  recordComparison: (
    genreContext: string,
    winnerTmdbId: number,
    loserTmdbId: number
  ) => void;
  getRankingsForGenre: (genreKey: string) => GenreRankedMovie[];
  getGenreStats: () => GenreStats[];
  getMoviePlacement: (tmdbId: number, genreKey: string) => MoviePlacement | null;
  addCustomGenre: (genreName: string) => void;
  getSeenMoviesInGenre: (genreKey: string) => RatedMovie[];
  isMovieSeen: (tmdbId: number) => boolean;
  resetProfile: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile on mount
  useEffect(() => {
    let stored = storage.getProfile();
    if (!stored) {
      // Seed with test data in development, empty profile in production
      stored = import.meta.env.DEV ? createSeedProfile() : storage.createProfile();
      storage.saveProfile(stored);
    }
    setProfile(stored);
    setLoading(false);
  }, []);

  const addRatedMovie = useCallback((movie: RatedMovie) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const updated = storage.addRatedMovie(prev, movie);
      return updated;
    });
  }, []);

  const recordComparison = useCallback(
    (genreContext: string, winnerTmdbId: number, loserTmdbId: number) => {
      setProfile((prev) => {
        if (!prev) return prev;

        // Find current Elo scores
        const winnerMovie = prev.moviesSeen.find((m) => m.tmdbId === winnerTmdbId);
        const loserMovie = prev.moviesSeen.find((m) => m.tmdbId === loserTmdbId);
        if (!winnerMovie || !loserMovie) return prev;

        const genreKey = genreContext.toLowerCase();
        const winnerElo = winnerMovie.eloRatings.find((r) => r.genreKey === genreKey)?.eloScore ?? 1500;
        const loserElo = loserMovie.eloRatings.find((r) => r.genreKey === genreKey)?.eloScore ?? 1500;

        const { winnerNew, loserNew } = updateRatings(winnerElo, loserElo);

        // Update both movies' Elo
        let updated = storage.updateMovieElo(prev, winnerTmdbId, genreKey, winnerNew, true);
        updated = storage.updateMovieElo(updated, loserTmdbId, genreKey, loserNew, false);

        // Save comparison record
        updated = storage.saveComparison(updated, {
          genreContext: genreKey,
          winnerTmdbId,
          loserTmdbId,
          winnerNewElo: winnerNew,
          loserNewElo: loserNew,
        });

        return updated;
      });
    },
    []
  );

  const getRankingsForGenre = useCallback(
    (genreKey: string): GenreRankedMovie[] => {
      if (!profile) return [];
      const key = genreKey.toLowerCase();
      const movies = storage.getRatedMoviesByGenre(profile, key);

      return movies
        .map((m) => {
          const rating = m.eloRatings.find((r) => r.genreKey === key);
          return {
            tmdbId: m.tmdbId,
            title: m.title,
            posterPath: m.posterPath,
            eloScore: rating?.eloScore ?? 1500,
            comparisons: rating?.comparisons ?? 0,
            rank: 0, // calculated below
          };
        })
        .sort((a, b) => b.eloScore - a.eloScore)
        .map((m, i) => ({ ...m, rank: i + 1 }));
    },
    [profile]
  );

  const getGenreStats = useCallback((): GenreStats[] => {
    if (!profile) return [];

    // Collect all unique genre keys
    const genreMap = new Map<string, { label: string; movies: Set<number>; comparisons: number }>();

    for (const movie of profile.moviesSeen) {
      for (const rating of movie.eloRatings) {
        const existing = genreMap.get(rating.genreKey) ?? {
          label: rating.genreLabel,
          movies: new Set<number>(),
          comparisons: 0,
        };
        existing.movies.add(movie.tmdbId);
        existing.comparisons += rating.comparisons;
        genreMap.set(rating.genreKey, existing);
      }
    }

    return Array.from(genreMap.entries())
      .map(([key, val]) => {
        const rankings = getRankingsForGenre(key);
        return {
          genreKey: key,
          genreLabel: val.label,
          movieCount: val.movies.size,
          totalComparisons: val.comparisons,
          topMovies: rankings.slice(0, 3),
        };
      })
      .sort((a, b) => b.movieCount - a.movieCount);
  }, [profile, getRankingsForGenre]);

  const getMoviePlacement = useCallback(
    (tmdbId: number, genreKey: string): MoviePlacement | null => {
      if (!profile) return null;
      const rankings = getRankingsForGenre(genreKey);
      const entry = rankings.find((r) => r.tmdbId === tmdbId);
      if (!entry) return null;

      const movie = profile.moviesSeen.find((m) => m.tmdbId === tmdbId);
      return {
        tmdbId,
        title: movie?.title ?? '',
        posterPath: movie?.posterPath ?? null,
        genreKey: genreKey.toLowerCase(),
        genreLabel: entry.eloScore > 0 ? genreKey : genreKey, // use raw key for label lookup
        rank: entry.rank,
        total: rankings.length,
        eloScore: entry.eloScore,
      };
    },
    [profile, getRankingsForGenre]
  );

  const addCustomGenre = useCallback((genreName: string) => {
    setProfile((prev) => {
      if (!prev) return prev;
      return storage.addCustomGenre(prev, genreName);
    });
  }, []);

  const getSeenMoviesInGenre = useCallback(
    (genreKey: string): RatedMovie[] => {
      if (!profile) return [];
      return storage.getRatedMoviesByGenre(profile, genreKey);
    },
    [profile]
  );

  const isMovieSeen = useCallback(
    (tmdbId: number): boolean => {
      return profile?.moviesSeen.some((m) => m.tmdbId === tmdbId) ?? false;
    },
    [profile]
  );

  const resetProfile = useCallback(() => {
    storage.clearProfile();
    const fresh = import.meta.env.DEV ? createSeedProfile() : storage.createProfile();
    storage.saveProfile(fresh);
    setProfile(fresh);
  }, []);

  return (
    <UserContext.Provider
      value={{
        profile,
        loading,
        addRatedMovie,
        recordComparison,
        getRankingsForGenre,
        getGenreStats,
        getMoviePlacement,
        addCustomGenre,
        getSeenMoviesInGenre,
        isMovieSeen,
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
