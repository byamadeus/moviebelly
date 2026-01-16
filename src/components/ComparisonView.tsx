import { useState } from 'react';
import MovieCard from './MovieCard';
import type { Movie } from '../services/tmdb';
import './ComparisonView.css';

interface ComparisonViewProps {
  movieA: Movie;
  movieB: Movie;
  onSelect: (winner: Movie, loser: Movie) => void;
}

const ComparisonView = ({ movieA, movieB, onSelect }: ComparisonViewProps) => {
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const handleSelect = (winner: Movie, loser: Movie) => {
    setSelectedId(winner.id);
    setTimeout(() => {
      onSelect(winner, loser);
      setSelectedId(null);
    }, 400);
  };

  return (
    <div className="comparison-view">
      <div className="comparison-view__header">
        <h1 className="comparison-view__title">Which do you prefer?</h1>
        <p className="comparison-view__subtitle">Tap the movie you like more</p>
      </div>

      <div className="comparison-view__cards">
        <div
          className={`comparison-view__card-wrapper ${
            selectedId === movieA.id ? 'selected' : ''
          } ${selectedId === movieB.id ? 'not-selected' : ''}`}
        >
          <MovieCard
            movie={movieA}
            onClick={() => handleSelect(movieA, movieB)}
          />
        </div>

        <div className="comparison-view__divider">
          <span className="comparison-view__vs">VS</span>
        </div>

        <div
          className={`comparison-view__card-wrapper ${
            selectedId === movieB.id ? 'selected' : ''
          } ${selectedId === movieA.id ? 'not-selected' : ''}`}
        >
          <MovieCard
            movie={movieB}
            onClick={() => handleSelect(movieB, movieA)}
          />
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
