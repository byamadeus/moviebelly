import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdbService, getImageUrl } from '../services/tmdb';
import { useUser } from '../contexts/UserContext';
import type { Movie } from '../services/tmdb';
import type { RatedMovie } from '../types/profile';
import {
  initInsertion,
  getCandidate,
  applyWin,
  applyLoss,
  applyNotAlike,
  getFinalRank,
  buildUpdatedRanks,
  type InsertionState,
} from '../services/insertion';
import './Compare.css';

interface MovieDetails extends Movie {
  genres?: { id: number; name: string }[];
}

// All globally ranked movies sorted by rank ASC, excluding the new movie
function getSortedMoviesGlobal(movies: RatedMovie[], excludeTmdbId: number): RatedMovie[] {
  return movies
    .filter((m) => m.tmdbId !== excludeTmdbId && m.rank > 0)
    .sort((a, b) => a.rank - b.rank);
}

const Compare = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { movies, recordComparison, updateGlobalRanks } = useUser();

  const newMovieTmdbId = parseInt(movieId ?? '0');

  // ── State ──────────────────────────────────────────────────────────────────
  const [newMovie, setNewMovie] = useState<MovieDetails | null>(null);
  const [insertionState, setInsertionState] = useState<InsertionState | null>(null);
  const [sortedList, setSortedList] = useState<RatedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [autoPlaceMessage, setAutoPlaceMessage] = useState<string | null>(null);

  const initialSpanRef = useRef<number>(0);
  // Stable ref to movies so setup effect doesn't re-run on every movies update
  const moviesRef = useRef<RatedMovie[]>(movies);
  useEffect(() => { moviesRef.current = movies; }, [movies]);

  // ── Initial TMDB fetch ────────────────────────────────────────────────────
  useEffect(() => {
    if (!movieId) { navigate('/'); return; }
    tmdbService.getMovieDetails(parseInt(movieId))
      .then(setNewMovie)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [movieId, navigate]);

  // ── Completion handler ────────────────────────────────────────────────────
  const handleComplete = useCallback(
    async (state: InsertionState, list: RatedMovie[]) => {
      setProcessing(true);
      const rank = getFinalRank(state);
      const rawList = list.map((m) => ({ tmdbId: m.tmdbId, rank: m.rank }));
      const rankedMovies = buildUpdatedRanks(rawList, newMovieTmdbId, rank);
      await updateGlobalRanks(rankedMovies);
      setProcessing(false);
      navigate(`/placement/${movieId}`);
    },
    [newMovieTmdbId, updateGlobalRanks, navigate, movieId]
  );

  // ── Setup binary insertion (runs once after movie data loads) ─────────────
  useEffect(() => {
    if (loading || !movieId) return;

    const currentMovies = moviesRef.current;
    const list = getSortedMoviesGlobal(currentMovies, newMovieTmdbId);
    const rawList = list.map((m) => ({ tmdbId: m.tmdbId, rank: m.rank }));

    setSortedList(list);

    const state = initInsertion(rawList);
    initialSpanRef.current = state.high - state.low;
    setInsertionState(state);

    // Auto-place if no comparisons needed (0 ranked movies)
    if (getCandidate(state) === null) {
      const msg = list.length === 0 ? "You're first! Placed at #1." : 'Placed!';
      setAutoPlaceMessage(msg);
      const timer = setTimeout(() => {
        setAutoPlaceMessage(null);
        handleComplete(state, list);
      }, 800);
      return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]); // run once after loading finishes

  // ── Derived: current comparison candidate ────────────────────────────────
  const candidateIndex = insertionState ? getCandidate(insertionState) : null;
  const candidate = candidateIndex !== null ? sortedList[candidateIndex] : null;

  // ── Progress calculation ──────────────────────────────────────────────────
  const currentSpan = insertionState ? insertionState.high - insertionState.low : 0;
  const progress = initialSpanRef.current > 0 ? 1 - currentSpan / initialSpanRef.current : 1;

  // ── Action handlers ───────────────────────────────────────────────────────

  const handleWin = () => {
    if (!insertionState || candidateIndex === null || processing) return;

    recordComparison({
      movieAId: newMovieTmdbId,
      movieBId: sortedList[candidateIndex].tmdbId,
      winnerId: newMovieTmdbId,
      isDissimilarSignal: false,
      isSkip: false,
    }).catch(console.error);

    const newState = applyWin(insertionState, candidateIndex);
    setInsertionState(newState);

    if (getCandidate(newState) === null) {
      handleComplete(newState, sortedList);
    }
  };

  const handleLoss = () => {
    if (!insertionState || candidateIndex === null || processing) return;

    recordComparison({
      movieAId: newMovieTmdbId,
      movieBId: sortedList[candidateIndex].tmdbId,
      winnerId: sortedList[candidateIndex].tmdbId,
      isDissimilarSignal: false,
      isSkip: false,
    }).catch(console.error);

    const newState = applyLoss(insertionState, candidateIndex);
    setInsertionState(newState);

    if (getCandidate(newState) === null) {
      handleComplete(newState, sortedList);
    }
  };

  const handleTooDifferent = () => {
    if (!insertionState || candidateIndex === null || processing) return;

    // Records dissimilarity signal — this IS written to Firestore
    recordComparison({
      movieAId: newMovieTmdbId,
      movieBId: sortedList[candidateIndex].tmdbId,
      winnerId: null,
      isDissimilarSignal: true,
      isSkip: false,
    }).catch(console.error);

    const newState = applyNotAlike(insertionState, sortedList[candidateIndex].tmdbId);
    setInsertionState(newState);

    if (getCandidate(newState) === null) {
      handleComplete(newState, sortedList);
    }
  };

  const handleSkip = () => {
    if (!insertionState || candidateIndex === null || processing) return;

    // Skip → NO Firestore write, just advance the algorithm
    const newState = applyNotAlike(insertionState, sortedList[candidateIndex].tmdbId);
    setInsertionState(newState);

    if (getCandidate(newState) === null) {
      handleComplete(newState, sortedList);
    }
  };

  // ── Render guards ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="compare compare--loading">
        <div className="compare__spinner" />
      </div>
    );
  }

  if (!movieId) {
    return (
      <div className="compare compare--error">
        <p>Something went wrong. Please try again.</p>
        <button onClick={() => navigate('/')} className="compare__button">Go Home</button>
      </div>
    );
  }

  // Auto-place flash screen
  if (autoPlaceMessage) {
    return (
      <div className="compare compare--auto-place">
        <div className="compare__auto-place-content">
          <p className="compare__auto-place-msg">{autoPlaceMessage}</p>
        </div>
      </div>
    );
  }

  // Processing spinner while binary insertion is settling
  if (!insertionState || candidateIndex === null || !candidate) {
    return (
      <div className="compare compare--loading">
        <div className="compare__spinner" />
      </div>
    );
  }

  const year = (date: string) => date ? new Date(date).getFullYear() : '';

  return (
    <div className="compare">
      {/* Convergence progress bar */}
      <div className="compare__progress">
        <div
          className="compare__progress-bar"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Question */}
      <div className="compare__question">
        <h1 className="compare__title">Which did you like better?</h1>
      </div>

      {/* Movie cards */}
      <div className="compare__cards">
        {/* Left card: the new movie being placed */}
        <button
          className="compare__card compare__card--new"
          onClick={handleWin}
          disabled={processing}
        >
          <div className="compare__card-new-badge">NEW</div>
          {newMovie?.poster_path ? (
            <img
              src={getImageUrl(newMovie.poster_path, 'w500')}
              alt={newMovie.title}
              className="compare__card-poster"
            />
          ) : (
            <div className="compare__card-placeholder">🎬</div>
          )}
          <div className="compare__card-info">
            <h3 className="compare__card-title">{newMovie?.title ?? '...'}</h3>
            <p className="compare__card-year">
              {newMovie?.release_date ? year(newMovie.release_date) : ''}
            </p>
          </div>
        </button>

        {/* OR divider */}
        <div className="compare__or-divider">OR</div>

        {/* Right card: existing ranked movie */}
        <button
          className="compare__card"
          onClick={handleLoss}
          disabled={processing}
        >
          {candidate.posterPath ? (
            <img
              src={getImageUrl(candidate.posterPath, 'w500')}
              alt={candidate.title}
              className="compare__card-poster"
            />
          ) : (
            <div className="compare__card-placeholder">🎬</div>
          )}
          <div className="compare__card-info">
            <h3 className="compare__card-title">{candidate.title}</h3>
            <p className="compare__card-year">
              {candidate.releaseDate ? year(candidate.releaseDate) : ''}
            </p>
          </div>
        </button>
      </div>

      {/* Footer: Back / Too Different / Skip */}
      <div className="compare__footer">
        <button
          className="compare__footer-btn compare__footer-btn--back"
          onClick={() => navigate(`/rate/${movieId}`)}
          disabled={processing}
        >
          ← Back
        </button>
        <button
          className="compare__footer-btn compare__footer-btn--different"
          onClick={handleTooDifferent}
          disabled={processing}
        >
          Too Different
        </button>
        <button
          className="compare__footer-btn compare__footer-btn--skip"
          onClick={handleSkip}
          disabled={processing}
        >
          Skip →
        </button>
      </div>
    </div>
  );
};

export default Compare;
