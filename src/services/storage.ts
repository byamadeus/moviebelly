// localStorage persistence layer for MovieBeli
// Designed with clean interfaces for future backend migration

import type {
  UserProfile,
  RatedMovie,
  Comparison,
  GenreEloRating,
} from '../types/profile';
import { DEFAULT_ELO } from './elo';

const PROFILE_KEY = 'moviebeli_profile';

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Profile Operations ───

export function getProfile(): UserProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as UserProfile) : null;
  } catch {
    return null;
  }
}

export function saveProfile(profile: UserProfile): void {
  profile.lastUpdated = Date.now();
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function createProfile(): UserProfile {
  const profile: UserProfile = {
    id: generateId(),
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    moviesSeen: [],
    comparisons: [],
    customGenres: [],
  };
  saveProfile(profile);
  return profile;
}

// ─── Movie Operations ───

export function addRatedMovie(profile: UserProfile, movie: RatedMovie): UserProfile {
  const exists = profile.moviesSeen.some((m) => m.tmdbId === movie.tmdbId);
  if (exists) return profile;

  const updated: UserProfile = {
    ...profile,
    moviesSeen: [...profile.moviesSeen, movie],
  };
  saveProfile(updated);
  return updated;
}

export function getRatedMoviesByGenre(profile: UserProfile, genreKey: string): RatedMovie[] {
  return profile.moviesSeen.filter(
    (m) =>
      m.userGenres.some((g) => g.toLowerCase() === genreKey.toLowerCase()) ||
      m.eloRatings.some((r) => r.genreKey.toLowerCase() === genreKey.toLowerCase())
  );
}

export function updateMovieElo(
  profile: UserProfile,
  tmdbId: number,
  genreKey: string,
  newElo: number,
  won: boolean
): UserProfile {
  const updated: UserProfile = {
    ...profile,
    moviesSeen: profile.moviesSeen.map((m) => {
      if (m.tmdbId !== tmdbId) return m;
      return {
        ...m,
        lastComparedAt: Date.now(),
        eloRatings: m.eloRatings.map((r) => {
          if (r.genreKey.toLowerCase() !== genreKey.toLowerCase()) return r;
          return {
            ...r,
            eloScore: newElo,
            comparisons: r.comparisons + 1,
            wins: won ? r.wins + 1 : r.wins,
            losses: won ? r.losses : r.losses + 1,
          };
        }),
      };
    }),
  };
  saveProfile(updated);
  return updated;
}

// ─── Comparison Operations ───

export function saveComparison(profile: UserProfile, comparison: Omit<Comparison, 'id' | 'timestamp'>): UserProfile {
  const full: Comparison = {
    ...comparison,
    id: generateId(),
    timestamp: Date.now(),
  };
  const updated: UserProfile = {
    ...profile,
    comparisons: [...profile.comparisons, full],
  };
  saveProfile(updated);
  return updated;
}

// ─── Genre Operations ───

export function addCustomGenre(profile: UserProfile, genreName: string): UserProfile {
  const normalized = genreName.trim();
  if (!normalized) return profile;
  if (profile.customGenres.some((g) => g.toLowerCase() === normalized.toLowerCase())) {
    return profile;
  }
  const updated: UserProfile = {
    ...profile,
    customGenres: [...profile.customGenres, normalized],
  };
  saveProfile(updated);
  return updated;
}

// ─── Helpers ───

export function createInitialEloRatings(genreLabels: string[]): GenreEloRating[] {
  return genreLabels.map((label) => ({
    genreKey: label.toLowerCase(),
    genreLabel: label,
    eloScore: DEFAULT_ELO,
    comparisons: 0,
    wins: 0,
    losses: 0,
  }));
}

export function clearProfile(): void {
  localStorage.removeItem(PROFILE_KEY);
}
