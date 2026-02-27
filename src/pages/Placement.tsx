import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import { getImageUrl } from '../services/tmdb';
import type { MoviePlacement as PlacementData } from '../types/profile';
import './Placement.css';

const Placement = () => {
  const { movieId, genreKey } = useParams<{ movieId: string; genreKey: string }>();
  const navigate = useNavigate();
  const { getMoviePlacement, getRankingsForGenre } = useUser();
  const [placement, setPlacement] = useState<PlacementData | null>(null);
  const [animatedRank, setAnimatedRank] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!movieId || !genreKey) return;
    const data = getMoviePlacement(parseInt(movieId), genreKey);
    setPlacement(data);

    // Staggered animation
    const t1 = setTimeout(() => setShowContent(true), 300);
    return () => clearTimeout(t1);
  }, [movieId, genreKey, getMoviePlacement]);

  // Animate rank counter
  useEffect(() => {
    if (!placement || !showContent) return;
    const target = placement.rank;
    const startFrom = Math.min(target + 5, placement.total);
    let current = startFrom;

    const interval = setInterval(() => {
      current--;
      setAnimatedRank(current);
      if (current <= target) clearInterval(interval);
    }, 120);

    return () => clearInterval(interval);
  }, [placement, showContent]);

  if (!placement) {
    return (
      <div className="placement placement--loading">
        <div className="placement__spinner" />
      </div>
    );
  }

  const rankings = getRankingsForGenre(genreKey!);
  const percentile = placement.total > 1
    ? Math.round(((placement.total - placement.rank) / (placement.total - 1)) * 100)
    : 100;

  return (
    <div className={`placement ${showContent ? 'placement--visible' : ''}`}>
      <div className="placement__poster-container">
        {placement.posterPath ? (
          <img
            src={getImageUrl(placement.posterPath, 'w500')}
            alt={placement.title}
            className="placement__poster"
          />
        ) : (
          <div className="placement__poster-placeholder" />
        )}
      </div>

      <div className="placement__info">
        <h1 className="placement__title">{placement.title}</h1>

        <div className="placement__rank-display">
          <span className="placement__rank-hash">#</span>
          <span className="placement__rank-number">{animatedRank || placement.rank}</span>
          <span className="placement__rank-context">
            in {placement.genreLabel || genreKey}
          </span>
        </div>

        <div className="placement__elo-badge">
          {placement.eloScore} Elo
        </div>

        {placement.total > 1 && (
          <div className="placement__percentile">
            Top {100 - percentile > 0 ? 100 - percentile : 1}%
          </div>
        )}

        {/* Mini ranking list */}
        {rankings.length > 1 && (
          <div className="placement__ranking-list">
            {rankings.slice(0, 5).map((m) => (
              <div
                key={m.tmdbId}
                className={`placement__ranking-item ${m.tmdbId === placement.tmdbId ? 'placement__ranking-item--active' : ''}`}
              >
                <span className="placement__ranking-num">#{m.rank}</span>
                <span className="placement__ranking-title">{m.title}</span>
                <span className="placement__ranking-elo">{m.eloScore}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="placement__actions">
        <button className="placement__action-primary" onClick={() => navigate('/')}>
          Rate Another Movie
        </button>
        <button className="placement__action-secondary" onClick={() => navigate('/profile')}>
          View Profile
        </button>
      </div>
    </div>
  );
};

export default Placement;
