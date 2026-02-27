import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { tmdbService, getImageUrl } from '../services/tmdb';
import { useUser } from '../contexts/UserContext';
import type { Movie } from '../services/tmdb';
import type { RatedMovie } from '../types/profile';
import './Compare.css';

interface MovieDetails extends Movie {
  genres?: { id: number; name: string }[];
}

interface CompareMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseDate: string;
}

const Compare = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { getSeenMoviesInGenre, recordComparison, isMovieSeen } = useUser();

  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [comparisonMovies, setComparisonMovies] = useState<CompareMovie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const state = location.state as { selectedGenres?: string[]; primaryGenre?: string } | null;
  const primaryGenre = state?.primaryGenre ?? '';
  const selectedGenres = state?.selectedGenres ?? [];

  useEffect(() => {
    const setup = async () => {
      if (!movieId) { navigate('/'); return; }

      try {
        const movieDetails = await tmdbService.getMovieDetails(parseInt(movieId));
        setSelectedMovie(movieDetails);

        // Get movies the user has already seen in this genre
        const seenMovies = primaryGenre
          ? getSeenMoviesInGenre(primaryGenre).filter(m => m.tmdbId !== parseInt(movieId))
          : [];

        if (seenMovies.length > 0) {
          // Compare against seen movies — select up to 5
          const selected = selectComparisonMovies(seenMovies, 5);
          setComparisonMovies(selected.map(m => ({
            tmdbId: m.tmdbId,
            title: m.title,
            posterPath: m.posterPath,
            releaseDate: m.releaseDate,
          })));
        } else {
          // Fallback: use TMDB similar movies for first-time users
          const genreIds = movieDetails.genres
            ? movieDetails.genres.map(g => g.id)
            : movieDetails.genre_ids || [];

          if (genreIds.length > 0) {
            const similar = await tmdbService.getSimilarMoviesByGenres(genreIds, movieDetails.id);
            setComparisonMovies(similar.slice(0, 5).map(m => ({
              tmdbId: m.id,
              title: m.title,
              posterPath: m.poster_path,
              releaseDate: m.release_date,
            })));
          }
        }

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch movies for comparison:', error);
        setLoading(false);
      }
    };

    setup();
  }, [movieId, navigate, primaryGenre, getSeenMoviesInGenre]);

  const handleComparison = (winnerId: number) => {
    if (!selectedMovie) return;
    const currentMovie = comparisonMovies[currentIndex];
    const loserId = winnerId === selectedMovie.id ? currentMovie.tmdbId : selectedMovie.id;

    // Only record Elo updates if both movies are in the user's profile
    if (primaryGenre && isMovieSeen(winnerId) && isMovieSeen(loserId)) {
      recordComparison(primaryGenre, winnerId, loserId);
    }

    if (currentIndex < comparisonMovies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All comparisons done — go to placement
      navigate(`/placement/${movieId}/${encodeURIComponent(primaryGenre.toLowerCase())}`);
    }
  };

  const handleSkipComparison = () => {
    if (currentIndex < comparisonMovies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigate(`/placement/${movieId}/${encodeURIComponent(primaryGenre.toLowerCase())}`);
    }
  };

  const totalComparisons = comparisonMovies.length;
  const progress = totalComparisons > 0 ? ((currentIndex + 1) / totalComparisons) * 100 : 0;

  if (loading) {
    return (
      <div className="compare compare--loading">
        <div className="compare__spinner" />
      </div>
    );
  }

  if (!selectedMovie || comparisonMovies.length === 0) {
    return (
      <div className="compare compare--error">
        <p>No movies to compare against yet.</p>
        <p className="compare__error-hint">Rate more movies in this genre to start comparing!</p>
        <button onClick={() => navigate('/')} className="compare__button">
          Rate Another Movie
        </button>
      </div>
    );
  }

  const currentMovie = comparisonMovies[currentIndex];

  return (
    <div className="compare">
      {/* Progress bar */}
      <div className="compare__progress">
        <div className="compare__progress-bar" style={{ width: `${progress}%` }} />
      </div>

      <div className="compare__header">
        <button className="compare__back" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <span className="compare__counter">{currentIndex + 1} / {totalComparisons}</span>
        <button className="compare__skip" onClick={() => navigate(`/placement/${movieId}/${encodeURIComponent(primaryGenre.toLowerCase())}`)}>
          Skip
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="compare__question">
        <h1 className="compare__title">Which movie did you like better?</h1>
        <div className="compare__tags">
          {selectedGenres.map((genre) => (
            <span key={genre} className="compare__tag">
              {genre}
              <span className="compare__tag-x">&times;</span>
            </span>
          ))}
        </div>
      </div>

      <div className="compare__cards">
        <button className="compare__card" onClick={() => handleComparison(selectedMovie.id)}>
          {selectedMovie.poster_path ? (
            <img src={getImageUrl(selectedMovie.poster_path, 'w500')} alt={selectedMovie.title} className="compare__card-poster" />
          ) : (
            <div className="compare__card-placeholder" />
          )}
          <div className="compare__card-info">
            <h3 className="compare__card-title">{selectedMovie.title}</h3>
            <p className="compare__card-director">
              {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : ''}
            </p>
          </div>
        </button>

        <button className="compare__card" onClick={() => handleComparison(currentMovie.tmdbId)}>
          {currentMovie.posterPath ? (
            <img src={getImageUrl(currentMovie.posterPath, 'w500')} alt={currentMovie.title} className="compare__card-poster" />
          ) : (
            <div className="compare__card-placeholder" />
          )}
          <div className="compare__card-info">
            <h3 className="compare__card-title">{currentMovie.title}</h3>
            <p className="compare__card-director">
              {currentMovie.releaseDate ? new Date(currentMovie.releaseDate).getFullYear() : ''}
            </p>
          </div>
        </button>
      </div>

      <div className="compare__footer">
        <button className="compare__difficult" onClick={handleSkipComparison}>
          Too Difficult
        </button>
      </div>
    </div>
  );
};

// Select comparison movies: prioritize variety in Elo scores
function selectComparisonMovies(movies: RatedMovie[], count: number): RatedMovie[] {
  if (movies.length <= count) return movies;

  // Sort by Elo and pick spread
  const sorted = [...movies].sort((a, b) => {
    const aElo = a.eloRatings[0]?.eloScore ?? 1500;
    const bElo = b.eloRatings[0]?.eloScore ?? 1500;
    return bElo - aElo;
  });

  const result: RatedMovie[] = [];
  // Pick from top, bottom, and middle
  result.push(sorted[0]); // highest
  result.push(sorted[sorted.length - 1]); // lowest

  // Fill the rest from the middle
  const middle = sorted.slice(1, -1);
  const step = Math.max(1, Math.floor(middle.length / (count - 2)));
  for (let i = 0; i < middle.length && result.length < count; i += step) {
    result.push(middle[i]);
  }

  // Shuffle to avoid predictable ordering
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result.slice(0, count);
}

export default Compare;
