import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdbService, getImageUrl } from '../services/tmdb';
import { useUser } from '../contexts/UserContext';
import { createInitialEloRatings } from '../services/storage';
import type { Movie } from '../services/tmdb';
import './Rate.css';

interface MovieDetails extends Movie {
  genres?: { id: number; name: string }[];
}

const Rate = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const { addRatedMovie, isMovieSeen, addCustomGenre } = useUser();
  const [movie, setMovie] = useState<MovieDetails | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedSimilar, setSelectedSimilar] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [customGenreInput, setCustomGenreInput] = useState('');
  const [showGenreInput, setShowGenreInput] = useState(false);
  const genreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMovieDetails = async () => {
      if (!movieId) return;

      try {
        const details = await tmdbService.getMovieDetails(parseInt(movieId));
        setMovie(details);

        if (details.genres) {
          setSelectedGenres(details.genres.map(g => g.name));
        }

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

  useEffect(() => {
    if (showGenreInput && genreInputRef.current) {
      genreInputRef.current.focus();
    }
  }, [showGenreInput]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres(prev =>
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const toggleSimilar = (id: number) => {
    setSelectedSimilar(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleAddCustomGenre = () => {
    const trimmed = customGenreInput.trim();
    if (!trimmed) return;
    if (!selectedGenres.some(g => g.toLowerCase() === trimmed.toLowerCase())) {
      setSelectedGenres(prev => [...prev, trimmed]);
      addCustomGenre(trimmed);
    }
    setCustomGenreInput('');
    setShowGenreInput(false);
  };

  const handleContinue = () => {
    if (!movie || selectedGenres.length === 0) return;

    // Add movie to profile if not already seen
    if (!isMovieSeen(movie.id)) {
      addRatedMovie({
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        releaseDate: movie.release_date,
        overview: movie.overview,
        tmdbGenreIds: movie.genres?.map(g => g.id) ?? [],
        userGenres: selectedGenres,
        eloRatings: createInitialEloRatings(selectedGenres),
        addedAt: Date.now(),
        lastComparedAt: Date.now(),
      });
    }

    navigate(`/compare/${movie.id}`, {
      state: {
        selectedGenres,
        primaryGenre: selectedGenres[0],
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
          <img src={getImageUrl(movie.backdrop_path, 'w780')} alt="" className="rate__backdrop-image" />
        ) : movie.poster_path ? (
          <img src={getImageUrl(movie.poster_path, 'w500')} alt="" className="rate__backdrop-image" />
        ) : null}
        <div className="rate__backdrop-overlay" />
      </div>

      <div className="rate__content">
        <div className="rate__header">
          {movie.poster_path && (
            <img src={getImageUrl(movie.poster_path, 'w342')} alt={movie.title} className="rate__poster" />
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
                {selectedGenres.includes(genre.name) && <span className="rate__tag-remove">&times;</span>}
              </button>
            ))}
            {/* Custom user-added genres */}
            {selectedGenres
              .filter(g => !movie.genres?.some(mg => mg.name === g))
              .map((genre) => (
                <button
                  key={genre}
                  className="rate__tag rate__tag--selected rate__tag--custom"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                  <span className="rate__tag-remove">&times;</span>
                </button>
              ))}
          </div>

          {showGenreInput ? (
            <div className="rate__genre-input-wrapper">
              <input
                ref={genreInputRef}
                type="text"
                className="rate__genre-input"
                placeholder="Type a genre or tag..."
                value={customGenreInput}
                onChange={(e) => setCustomGenreInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddCustomGenre();
                  if (e.key === 'Escape') { setShowGenreInput(false); setCustomGenreInput(''); }
                }}
                onBlur={() => {
                  if (customGenreInput.trim()) handleAddCustomGenre();
                  else setShowGenreInput(false);
                }}
              />
            </div>
          ) : (
            <button className="rate__add-button" onClick={() => setShowGenreInput(true)}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M8 11V5M5 8h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Add a genre or tag...
            </button>
          )}
        </div>

        {similarMovies.length > 0 && (
          <div className="rate__section">
            <h2 className="rate__section-title">Was this similar to:</h2>
            <div className="rate__similar-movies">
              {similarMovies.map((similar) => (
                <button
                  key={similar.id}
                  className={`rate__tag ${selectedSimilar.includes(similar.id) ? 'rate__tag--selected' : ''}`}
                  onClick={() => toggleSimilar(similar.id)}
                >
                  {similar.title} ({similar.release_date ? new Date(similar.release_date).getFullYear() : '?'})
                  {selectedSimilar.includes(similar.id) && <span className="rate__tag-remove">&times;</span>}
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

        <button
          className="rate__continue"
          onClick={handleContinue}
          disabled={selectedGenres.length === 0}
        >
          Continue to Rate
        </button>
      </div>
    </div>
  );
};

export default Rate;
