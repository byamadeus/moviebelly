import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdbService, getImageUrl } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './Rate.css';

interface MovieDetails extends Movie {
  genres?: { id: number; name: string }[];
  backdrop_path?: string;
}

const Rate = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedSimilar, setSelectedSimilar] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!movieId) return;

      try {
        const details = await tmdbService.getMovieDetails(parseInt(movieId));
        setMovie(details);

        // Pre-select all genres
        if (details.genres) {
          setSelectedGenres(details.genres.map(g => g.name));
        }

        // Fetch similar movies
        const similar = await tmdbService.getSimilarMovies(parseInt(movieId));
        setSimilarMovies(similar.slice(0, 3));

        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch movie details:', error);
        setLoading(false);
      }
    };

    fetchMovieDetails();
  }, [movieId]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre)
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };

  const toggleSimilar = (movieId: number) => {
    setSelectedSimilar(prev =>
      prev.includes(movieId)
        ? prev.filter(id => id !== movieId)
        : [...prev, movieId]
    );
  };

  const handleContinue = () => {
    if (!movie) return;

    // Navigate to comparison view with the movie and selected context
    navigate(`/compare/${movie.id}`, {
      state: {
        selectedGenres,
        selectedSimilar: similarMovies.filter(m => selectedSimilar.includes(m.id)),
      }
    });
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

  return (
    <div className="rate">
      <div className="rate__backdrop">
        {movie.backdrop_path ? (
          <img
            src={getImageUrl(movie.backdrop_path, 'w780')}
            alt=""
            className="rate__backdrop-image"
          />
        ) : movie.poster_path ? (
          <img
            src={getImageUrl(movie.poster_path, 'w500')}
            alt=""
            className="rate__backdrop-image"
          />
        ) : null}
        <div className="rate__backdrop-overlay" />
      </div>

      <div className="rate__content">
        <div className="rate__header">
          {movie.poster_path && (
            <img
              src={getImageUrl(movie.poster_path, 'w342')}
              alt={movie.title}
              className="rate__poster"
            />
          )}
        </div>

        <h1 className="rate__title">{movie.title}</h1>

        <div className="rate__section">
          <h2 className="rate__section-title">How would you describe this movie?</h2>
          <div className="rate__tags">
            {movie.genres?.map((genre) => (
              <button
                key={genre.id}
                className={`rate__tag ${selectedGenres.includes(genre.name) ? 'rate__tag--selected' : ''}`}
                onClick={() => toggleGenre(genre.name)}
              >
                {genre.name}
                {selectedGenres.includes(genre.name) && (
                  <span className="rate__tag-remove">×</span>
                )}
              </button>
            ))}
          </div>
          <button className="rate__add-button">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 11V5M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Add a similar movie...
          </button>
        </div>

        {similarMovies.length > 0 && (
          <div className="rate__section">
            <h2 className="rate__section-title">Was this movie similar to:</h2>
            <div className="rate__similar-movies">
              {similarMovies.map((similar) => (
                <button
                  key={similar.id}
                  className={`rate__tag ${selectedSimilar.includes(similar.id) ? 'rate__tag--selected' : ''}`}
                  onClick={() => toggleSimilar(similar.id)}
                >
                  {similar.title} ({similar.release_date ? new Date(similar.release_date).getFullYear() : '?'})
                  {selectedSimilar.includes(similar.id) && (
                    <span className="rate__tag-remove">×</span>
                  )}
                </button>
              ))}
            </div>
            <button className="rate__add-button">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 11V5M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add a similar movie...
            </button>
          </div>
        )}

        <button className="rate__continue" onClick={handleContinue}>
          Continue to Rate
        </button>
      </div>
    </div>
  );
};

export default Rate;
