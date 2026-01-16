import { useState, useEffect, useRef } from 'react';
import { tmdbService, getImageUrl } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './MovieSearch.css';

interface MovieSearchProps {
  onMovieSelect: (movie: Movie) => void;
}

const MovieSearch = ({ onMovieSelect }: MovieSearchProps) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    // Debounce search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const movies = await tmdbService.searchMovies(query);
        setResults(movies.slice(0, 8)); // Show top 8 results
        setLoading(false);
      } catch (error) {
        console.error('Search failed:', error);
        setLoading(false);
      }
    }, 400);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query]);

  const handleSelect = (movie: Movie) => {
    setQuery('');
    setResults([]);
    setIsFocused(false);
    onMovieSelect(movie);
  };

  return (
    <div className="movie-search">
      <div className="movie-search__input-wrapper">
        <svg
          className="movie-search__icon"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M9 17A8 8 0 1 0 9 1a8 8 0 0 0 0 16zM18.5 18.5l-4-4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <input
          type="text"
          className="movie-search__input"
          placeholder="Search for a movie you just watched..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
        />
        {loading && <div className="movie-search__spinner" />}
      </div>

      {isFocused && results.length > 0 && (
        <div className="movie-search__results">
          {results.map((movie) => (
            <button
              key={movie.id}
              className="movie-search__result"
              onClick={() => handleSelect(movie)}
            >
              {movie.poster_path ? (
                <img
                  src={getImageUrl(movie.poster_path, 'w92')}
                  alt={movie.title}
                  className="movie-search__result-poster"
                />
              ) : (
                <div className="movie-search__result-poster-placeholder">
                  🎬
                </div>
              )}
              <div className="movie-search__result-info">
                <h4 className="movie-search__result-title">{movie.title}</h4>
                <p className="movie-search__result-year">
                  {movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A'}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {isFocused && query.length >= 2 && results.length === 0 && !loading && (
        <div className="movie-search__no-results">
          No movies found for "{query}"
        </div>
      )}
    </div>
  );
};

export default MovieSearch;
