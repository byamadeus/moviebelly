import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { getImageUrl } from '../services/tmdb';
import './Profile.css';

const Profile = () => {
  const navigate = useNavigate();
  const { profile, getGenreStats, getRankingsForGenre } = useUser();
  const [expandedGenre, setExpandedGenre] = useState<string | null>(null);

  const genreStats = getGenreStats();

  const totalMovies = profile?.moviesSeen.length ?? 0;
  const totalComparisons = profile?.comparisons.length ?? 0;
  const totalGenres = genreStats.length;

  const toggleGenre = (genreKey: string) => {
    setExpandedGenre((prev) => (prev === genreKey ? null : genreKey));
  };

  return (
    <div className="profile">
      <div className="profile__header">
        <button className="profile__back" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <h1 className="profile__title">Your Profile</h1>
      </div>

      <div className="profile__stats">
        <div className="profile__stat">
          <span className="profile__stat-value">{totalMovies}</span>
          <span className="profile__stat-label">Movies</span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-value">{totalGenres}</span>
          <span className="profile__stat-label">Genres</span>
        </div>
        <div className="profile__stat">
          <span className="profile__stat-value">{totalComparisons}</span>
          <span className="profile__stat-label">Comparisons</span>
        </div>
      </div>

      {genreStats.length === 0 ? (
        <div className="profile__empty">
          <p>No movies rated yet.</p>
          <button className="profile__cta" onClick={() => navigate('/')}>
            Rate Your First Movie
          </button>
        </div>
      ) : (
        <div className="profile__genres">
          {genreStats.map((genre) => {
            const isExpanded = expandedGenre === genre.genreKey;
            const fullRankings = isExpanded ? getRankingsForGenre(genre.genreKey) : [];

            return (
              <div key={genre.genreKey} className="profile__genre">
                <button
                  className="profile__genre-header"
                  onClick={() => toggleGenre(genre.genreKey)}
                >
                  <div className="profile__genre-info">
                    <h2 className="profile__genre-name">{genre.genreLabel}</h2>
                    <span className="profile__genre-count">
                      {genre.movieCount} movie{genre.movieCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <svg
                    className={`profile__genre-arrow ${isExpanded ? 'profile__genre-arrow--expanded' : ''}`}
                    width="20" height="20" viewBox="0 0 20 20" fill="none"
                  >
                    <path d="M7 8l3 3 3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {/* Top 3 preview */}
                {!isExpanded && genre.topMovies.length > 0 && (
                  <div className="profile__genre-preview">
                    {genre.topMovies.map((movie) => (
                      <div key={movie.tmdbId} className="profile__preview-movie">
                        <span className="profile__preview-rank">#{movie.rank}</span>
                        {movie.posterPath ? (
                          <img
                            src={getImageUrl(movie.posterPath, 'w92')}
                            alt={movie.title}
                            className="profile__preview-poster"
                          />
                        ) : (
                          <div className="profile__preview-poster-placeholder" />
                        )}
                        <div className="profile__preview-info">
                          <span className="profile__preview-title">{movie.title}</span>
                          <span className="profile__preview-elo">{movie.eloScore}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Expanded full ranking */}
                {isExpanded && (
                  <div className="profile__genre-rankings">
                    {fullRankings.map((movie) => (
                      <div key={movie.tmdbId} className="profile__rank-item">
                        <span className="profile__rank-number">#{movie.rank}</span>
                        {movie.posterPath ? (
                          <img
                            src={getImageUrl(movie.posterPath, 'w92')}
                            alt={movie.title}
                            className="profile__rank-poster"
                          />
                        ) : (
                          <div className="profile__rank-poster-placeholder" />
                        )}
                        <div className="profile__rank-info">
                          <span className="profile__rank-title">{movie.title}</span>
                          <div className="profile__rank-meta">
                            <span className="profile__rank-elo">{movie.eloScore}</span>
                            <span className="profile__rank-comps">
                              {movie.comparisons} comparison{movie.comparisons !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Profile;
