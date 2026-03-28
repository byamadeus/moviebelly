// Firestore data layer — replaces localStorage storage.ts
// Collections: /users/{uid}, /users/{uid}/movies/{tmdbId}, /users/{uid}/comparisons/{id}

import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  addDoc,
  query,
  orderBy,
  serverTimestamp,
  increment,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db } from './firebase';
import type {
  UserProfile,
  RatedMovie,
  WatchlistItem,
  Comparison,
  MoviePlacement,
} from '../types/profile';

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? (snap.data() as UserProfile) : null;
}

export async function createUserProfile(firebaseUser: User): Promise<UserProfile> {
  const profile: UserProfile = {
    id: firebaseUser.uid,
    displayName: firebaseUser.displayName ?? 'Movie Fan',
    email: firebaseUser.email ?? '',
    photoURL: firebaseUser.photoURL,
    createdAt: Date.now(),
    lastUpdated: Date.now(),
    friendIds: [],
    visibility: 'friends',
    customGenres: [],
    movieCount: 0,
    comparisonCount: 0,
    watchlist: [],
  };
  await setDoc(doc(db, 'users', firebaseUser.uid), profile);
  return profile;
}

export async function updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  await updateDoc(doc(db, 'users', uid), { ...updates, lastUpdated: Date.now() });
}

// ─── Watchlist ─────────────────────────────────────────────────────────────────

export async function addToWatchlist(uid: string, item: WatchlistItem): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    watchlist: arrayUnion(item),
    lastUpdated: Date.now(),
  });
}

export async function removeFromWatchlist(uid: string, tmdbId: number): Promise<void> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return;
  const profile = snap.data() as UserProfile;
  const item = profile.watchlist.find((w) => w.tmdbId === tmdbId);
  if (!item) return;
  await updateDoc(doc(db, 'users', uid), {
    watchlist: arrayRemove(item),
    lastUpdated: Date.now(),
  });
}

// ─── Movies ───────────────────────────────────────────────────────────────────

export async function getRatedMovies(uid: string): Promise<RatedMovie[]> {
  const snap = await getDocs(collection(db, 'users', uid, 'movies'));
  return snap.docs.map((d) => d.data() as RatedMovie);
}

export async function addRatedMovie(uid: string, movie: RatedMovie): Promise<void> {
  const movieRef = doc(db, 'users', uid, 'movies', String(movie.tmdbId));
  const existing = await getDoc(movieRef);
  if (existing.exists()) return;

  const batch = writeBatch(db);
  batch.set(movieRef, movie);
  batch.update(doc(db, 'users', uid), {
    movieCount: increment(1),
    lastUpdated: Date.now(),
  });
  await batch.commit();
}

// Batch-update global ranks for all affected movies after binary insertion
export async function updateGlobalRanks(
  uid: string,
  rankedMovies: { tmdbId: number; rank: number; totalRanked: number }[]
): Promise<void> {
  const batch = writeBatch(db);
  const now = Date.now();

  for (const { tmdbId, rank, totalRanked } of rankedMovies) {
    const movieRef = doc(db, 'users', uid, 'movies', String(tmdbId));
    const snap = await getDoc(movieRef);
    if (!snap.exists()) continue;

    const movie = snap.data() as RatedMovie;
    const record = { rank, totalRanked, placedAt: now };
    const placementHistory = [...(movie.placementHistory ?? []), record];

    batch.update(movieRef, {
      rank,
      totalRanked,
      placedAt: now,
      placementHistory,
      lastUpdatedAt: now,
    });
  }

  await batch.commit();
}

// ─── Comparisons ─────────────────────────────────────────────────────────────

export async function saveComparison(
  uid: string,
  comparison: Omit<Comparison, 'id' | 'timestamp'>
): Promise<string> {
  const full = {
    ...comparison,
    isSkip: comparison.isSkip ?? false,
    timestamp: Date.now(),
  };

  const ref = await addDoc(collection(db, 'users', uid, 'comparisons'), full);

  // Increment denormalized count only for real comparisons
  if (!comparison.isDissimilarSignal && !comparison.isSkip) {
    await updateDoc(doc(db, 'users', uid), {
      comparisonCount: increment(1),
      lastUpdated: Date.now(),
    });
  }

  return ref.id;
}

export async function getComparisons(uid: string): Promise<Comparison[]> {
  const snap = await getDocs(
    query(collection(db, 'users', uid, 'comparisons'), orderBy('timestamp', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Comparison);
}

// ─── Genre / Custom Genres ────────────────────────────────────────────────────

export async function addCustomGenre(uid: string, genreName: string): Promise<void> {
  const profileRef = doc(db, 'users', uid);
  const snap = await getDoc(profileRef);
  if (!snap.exists()) return;

  const profile = snap.data() as UserProfile;
  const normalized = genreName.trim();
  if (!normalized) return;
  if (profile.customGenres.some((g) => g.toLowerCase() === normalized.toLowerCase())) return;

  await updateDoc(profileRef, {
    customGenres: [...profile.customGenres, normalized],
    lastUpdated: Date.now(),
  });
}

// ─── Social / Friends ─────────────────────────────────────────────────────────

export async function followUser(currentUid: string, targetUid: string): Promise<void> {
  if (currentUid === targetUid) return;

  const profileRef = doc(db, 'users', currentUid);
  const snap = await getDoc(profileRef);
  if (!snap.exists()) return;

  const profile = snap.data() as UserProfile;
  if (profile.friendIds.includes(targetUid)) return;

  await updateDoc(profileRef, {
    friendIds: [...profile.friendIds, targetUid],
    lastUpdated: Date.now(),
  });
}

export async function getFriendProfile(friendUid: string): Promise<UserProfile | null> {
  return getUserProfile(friendUid);
}

export async function getFriendMovies(friendUid: string): Promise<RatedMovie[]> {
  return getRatedMovies(friendUid);
}

// ─── Derived / Computed Helpers ───────────────────────────────────────────────

// All globally ranked movies sorted by rank ASC (rank > 0 only)
export function computeGlobalRankings(movies: RatedMovie[]): RatedMovie[] {
  return movies
    .filter((m) => m.rank > 0)
    .sort((a, b) => a.rank - b.rank);
}

export function computeMoviePlacement(
  movies: RatedMovie[],
  tmdbId: number
): MoviePlacement | null {
  const movie = movies.find((m) => m.tmdbId === tmdbId);
  if (!movie || movie.rank === 0) return null;

  return {
    tmdbId,
    title: movie.title,
    posterPath: movie.posterPath,
    rank: movie.rank,
    total: movie.totalRanked,
  };
}

// ─── Dev / Testing Utilities ─────────────────────────────────────────────────

export async function resetProfile(uid: string): Promise<void> {
  const batch = writeBatch(db);

  const moviesSnap = await getDocs(collection(db, 'users', uid, 'movies'));
  for (const d of moviesSnap.docs) {
    batch.delete(d.ref);
  }

  const compsSnap = await getDocs(collection(db, 'users', uid, 'comparisons'));
  for (const d of compsSnap.docs) {
    batch.delete(d.ref);
  }

  batch.update(doc(db, 'users', uid), {
    movieCount: 0,
    comparisonCount: 0,
    customGenres: [],
    watchlist: [],
    lastUpdated: Date.now(),
  });

  await batch.commit();
}

export { serverTimestamp };
