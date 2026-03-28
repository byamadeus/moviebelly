import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { tmdbService, getImageUrl } from '../services/tmdb';
import { useUser } from '../contexts/UserContext';
import type { Movie } from '../services/tmdb';
import './Find.css';

const Find = () => {
  const navigate = useNavigate();
  const { movies, watchlist, isMovieRanked } = useUser();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [nowPlayingLoading, setNowPlayingLoading] = useState(true);

  const isSearching = query.length >= 1;

  // Load now-playing movies on mount
  useEffect(() => {
    tmdbService.getNowPlayingMovies()
      .then((results) => setNowPlaying(results.slice(0, 8)))
      .catch(() => {})
      .finally(() => setNowPlayingLoading(false));
  }, []);

  // Search as user types
  useEffect(() => {
    if (!isSearching) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const results = await tmdbService.searchMovies(query);
        setSearchResults(results.slice(0, 10));
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, isSearching]);

  const handleMovieSelect = (movieId: number) => {
    navigate(`/rate/${movieId}`);
  };

  const renderRankedBadge = (tmdbId: number) => {
    if (!isMovieRanked(tmdbId)) return null;
    const m = movies.find((m) => m.tmdbId === tmdbId);
    return (
      <span className="find__ranked-badge">
        #{m?.rank}
      </span>
    );
  };

  return (
    <div className="find">
      <div className="find__content">

        {/* Top bar */}
        <div className="find__top-bar">
          {isSearching ? (
            <>
              <h1 className="find__query-text">{query}</h1>
              <button
                className="find__clear-button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
              >
                ✕
              </button>
            </>
          ) : (
            <>
              <h1 className="find__title">Rank a movie</h1>
              <button
                className="find__profile-button"
                onClick={() => navigate('/profile')}
                aria-label="View profile"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M4 21c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                {movies.length > 0 && (
                  <span className="find__profile-badge">{movies.length}</span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Search bar */}
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
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {/* ── Search results ─────────────────────────────────────────────── */}
        {isSearching && (
          <>
            {searchLoading && (
              <div className="find__loading">
                <div className="find__spinner" />
              </div>
            )}

            {!searchLoading && searchResults.length === 0 && (
              <div className="find__no-results">No movies found</div>
            )}

            {searchResults.length > 0 && (
              <div className="find__results">
                {searchResults.map((movie) => (
                  <button
                    key={movie.id}
                    className="find__result"
                    onClick={() => handleMovieSelect(movie.id)}
                  >
                    {movie.poster_path ? (
                      <img
                        src={getImageUrl(movie.poster_path, 'w154')}
                        alt={movie.title}
                        className="find__result-poster"
                      />
                    ) : (
                      <div className="find__result-poster-placeholder">🎬</div>
                    )}
                    <div className="find__result-info">
                      <h3 className="find__result-title">{movie.title}</h3>
                      <p className="find__result-year">
                        {movie.release_date ? new Date(movie.release_date).getFullYear() : '—'}
                      </p>
                    </div>
                    {renderRankedBadge(movie.id)}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Home state (no search) ─────────────────────────────────────── */}
        {!isSearching && (
          <>
            {/* Recently Released */}
            <div className="find__section">
              <h2 className="find__section-title">Recently Released</h2>
              {nowPlayingLoading ? (
                <div className="find__loading">
                  <div className="find__spinner" />
                </div>
              ) : (
                <div className="find__poster-row">
                  {nowPlaying.map((movie) => (
                    <button
                      key={movie.id}
                      className="find__poster-card"
                      onClick={() => handleMovieSelect(movie.id)}
                    >
                      {movie.poster_path ? (
                        <img
                          src={getImageUrl(movie.poster_path, 'w185')}
                          alt={movie.title}
                          className="find__poster-img"
                        />
                      ) : (
                        <div className="find__poster-placeholder">🎬</div>
                      )}
                      {renderRankedBadge(movie.id)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* On Your Watchlist */}
            <div className="find__section">
              <h2 className="find__section-title">On Your Watchlist</h2>
              {watchlist.length === 0 ? (
                <p className="find__empty-watchlist">
                  Save movies here to rank later
                </p>
              ) : (
                <div className="find__watchlist-grid">
                  {watchlist.slice(0, 4).map((item) => (
                    <button
                      key={item.tmdbId}
                      className="find__poster-card"
                      onClick={() => handleMovieSelect(item.tmdbId)}
                    >
                      {item.posterPath ? (
                        <img
                          src={getImageUrl(item.posterPath, 'w185')}
                          alt={item.title}
                          className="find__poster-img"
                        />
                      ) : (
                        <div className="find__poster-placeholder">🎬</div>
                      )}
                      {renderRankedBadge(item.tmdbId)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default Find;
