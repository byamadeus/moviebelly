import { getImageUrl } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './MovieCard.css';

interface MovieCardProps {
  movie: Movie;
  onClick?: () => void;
  className?: string;
}

const MovieCard = ({ movie, onClick, className = '' }: MovieCardProps) => {
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';

  return (
    <div className={`movie-card ${className}`} onClick={onClick}>
      <div className="movie-card__poster">
        <img
          src={getImageUrl(movie.poster_path, 'w500')}
          alt={movie.title}
          className="movie-card__image"
        />
        <div className="movie-card__gradient" />
      </div>

      <div className="movie-card__info">
        <h2 className="movie-card__title">{movie.title}</h2>
        <p className="movie-card__year">{releaseYear}</p>
        {movie.overview && (
          <p className="movie-card__overview">{movie.overview}</p>
        )}
      </div>
    </div>
  );
};

export default MovieCard;
