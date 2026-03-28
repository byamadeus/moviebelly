import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdbService, getImageUrl } from '../services/tmdb';
import { useUser } from '../contexts/UserContext';
import type { Movie } from '../services/tmdb';
import './Rate.css';

interface MovieDetails extends Movie {
  genres?: { id: number; name: string }[];
}

const Rate = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { addRatedMovie, isMovieRanked, isOnWatchlist, addToWatchlist, removeFromWatchlist, movies } = useUser();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!movieId) return;
    setLoading(true);
    tmdbService.getMovieDetails(parseInt(movieId))
      .then(setMovie)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [movieId]);

  const ranked = movie ? isMovieRanked(movie.id) : false;
  const onWatchlist = movie ? isOnWatchlist(movie.id) : false;
  const existingMovie = movie ? movies.find((m) => m.tmdbId === movie.id) : undefined;

  const handleRank = async () => {
    if (!movie) return;
    const now = Date.now();

    // Add to rated movies if not already tracked
    if (!movies.some((m) => m.tmdbId === movie.id)) {
      await addRatedMovie({
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path ?? null,
        releaseDate: movie.release_date,
        overview: movie.overview,
        tmdbGenreIds: movie.genres?.map((g) => g.id) ?? [],
        tmdbGenreNames: movie.genres?.map((g) => g.name) ?? [],
        addedAt: now,
        lastUpdatedAt: now,
        rank: 0,
        totalRanked: 0,
        placedAt: 0,
        placementHistory: [],
      });
    }

    navigate(`/compare/${movie.id}`);
  };

  const handleWatchlist = async () => {
    if (!movie || saving) return;
    setSaving(true);
    try {
      if (onWatchlist) {
        await removeFromWatchlist(movie.id);
      } else {
        await addToWatchlist({
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          addedAt: Date.now(),
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rate rate--loading">
        <div className="rate__spinner" />
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="rate rate--error">
        <p>Movie not found</p>
        <button onClick={() => navigate('/')} className="rate__back-button">
          Go Back
        </button>
      </div>
    );
  }

  const year = movie.release_date ? new Date(movie.release_date).getFullYear() : null;

  return (
    <div className="rate">
      {/* Backdrop */}
      <div className="rate__backdrop">
        {movie.backdrop_path ? (
          <img src={getImageUrl(movie.backdrop_path, 'w780')} alt="" className="rate__backdrop-image" />
        ) : movie.poster_path ? (
          <img src={getImageUrl(movie.poster_path, 'w500')} alt="" className="rate__backdrop-image" />
        ) : null}
        <div className="rate__backdrop-overlay" />
      </div>

      {/* Back button */}
      <button className="rate__nav-back" onClick={() => navigate(-1)} aria-label="Go back">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M12 4L6 10L12 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div className="rate__content">
        {/* Poster */}
        <div className="rate__header">
          {movie.poster_path && (
            <img src={getImageUrl(movie.poster_path, 'w342')} alt={movie.title} className="rate__poster" />
          )}
        </div>

        {/* Title + year */}
        <h1 className="rate__title">{movie.title}</h1>
        {year && <p className="rate__year">{year}</p>}

        {/* Current rank badge (if already ranked) */}
        {ranked && existingMovie && (
          <div className="rate__rank-badge">
            Currently ranked #{existingMovie.rank} of {existingMovie.totalRanked}
          </div>
        )}

        {/* Action buttons */}
        <div className="rate__actions">
          <button className="rate__rank-button" onClick={handleRank}>
            ★ {ranked ? 'Re-rank' : 'Rank'}
          </button>
          <button
            className={`rate__watchlist-button ${onWatchlist ? 'rate__watchlist-button--saved' : ''}`}
            onClick={handleWatchlist}
            disabled={saving}
          >
            {onWatchlist ? '🔖 Saved' : '🔖 Save to list'}
          </button>
        </div>

        {/* Expandable details */}
        <button
          className="rate__details-toggle"
          onClick={() => setDetailsOpen((v) => !v)}
        >
          {detailsOpen ? 'Close Details ▴' : 'Open Details ▾'}
        </button>

        {detailsOpen && (
          <div className="rate__details">
            {movie.genres && movie.genres.length > 0 && (
              <div className="rate__genre-tags">
                {movie.genres.map((g) => (
                  <span key={g.id} className="rate__genre-tag">{g.name}</span>
                ))}
              </div>
            )}
            {movie.overview && (
              <p className="rate__overview">{movie.overview}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Rate;
