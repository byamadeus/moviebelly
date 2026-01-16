import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbService, getImageUrl } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './Find.css';

const Find = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);

    if (searchQuery.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setLoading(true);
    setShowResults(true);

    try {
      const movies = await tmdbService.searchMovies(searchQuery);
      setResults(movies.slice(0, 10));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMovieSelect = (movie: Movie) => {
    navigate(`/rate/${movie.id}`);
  };

  return (
    <div className="find">
      <div className="find__content">
        <h1 className="find__title">Rank a movie</h1>

        <div className="find__search">
          <div className="find__search-icon">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="8.5" cy="8.5" r="7" stroke="currentColor" strokeWidth="2"/>
              <path d="M13.5 13.5L18.5 18.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <input
            type="text"
            className="find__search-input"
            placeholder="Search for a movie..."
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
          />
        </div>

        {loading && (
          <div className="find__loading">
            <div className="find__spinner" />
          </div>
        )}

        {showResults && !loading && results.length === 0 && query.length >= 2 && (
          <div className="find__no-results">
            No movies found
          </div>
        )}

        {showResults && results.length > 0 && (
          <div className="find__results">
            {results.map((movie) => (
              <button
                key={movie.id}
                className="find__result"
                onClick={() => handleMovieSelect(movie)}
              >
                {movie.poster_path ? (
                  <img
                    src={getImageUrl(movie.poster_path, 'w154')}
                    alt={movie.title}
                    className="find__result-poster"
                  />
                ) : (
                  <div className="find__result-poster-placeholder">
                    🎬
                  </div>
                )}
                <div className="find__result-info">
                  <h3 className="find__result-title">{movie.title}</h3>
                  <p className="find__result-year">
                    {movie.release_date ? new Date(movie.release_date).getFullYear() : '—'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Find;
