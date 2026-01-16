import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tmdbService, getImageUrl } from '../services/tmdb';
import type { Movie } from '../services/tmdb';
import './Compare.css';

interface MovieDetails extends Movie {
  genres?: { id: number; name: string }[];
}

const Compare = () => {
  const { movieId } = useParams<{ movieId: string }>();
  const navigate = useNavigate();
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [similarMovies, setSimilarMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [comparisons, setComparisons] = useState<Array<{ winner: Movie; loser: Movie }>>([]);

  useEffect(() => {
    const fetchMoviesForComparison = async () => {
      if (!movieId) {
        navigate('/');
        return;
      }

      try {
        const movieDetails = await tmdbService.getMovieDetails(parseInt(movieId));
        setSelectedMovie(movieDetails);

        const genreIds = movieDetails.genres
          ? movieDetails.genres.map(g => g.id)
          : movieDetails.genre_ids || [];

        if (genreIds.length === 0) {
          setLoading(false);
          return;
        }

        const similar = await tmdbService.getSimilarMoviesByGenres(
          genreIds,
          movieDetails.id
        );

        setSimilarMovies(similar.slice(0, 5));
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch movies for comparison:', error);
        setLoading(false);
      }
    };

    fetchMoviesForComparison();
  }, [movieId, navigate]);

  const handleComparison = (winner: Movie) => {
    const loser = winner.id === selectedMovie?.id ? similarMovies[currentIndex] : selectedMovie;

    setComparisons([...comparisons, { winner, loser: loser! }]);

    if (currentIndex < similarMovies.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      console.log('All comparisons complete:', comparisons);
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="compare compare--loading">
        <div className="compare__spinner" />
      </div>
    );
  }

  if (!selectedMovie || similarMovies.length === 0) {
    return (
      <div className="compare compare--error">
        <p>Couldn't find similar movies to compare.</p>
        <button onClick={() => navigate('/')} className="compare__button">
          Try Another Movie
        </button>
      </div>
    );
  }

  const currentMovie = similarMovies[currentIndex];

  return (
    <div className="compare">
      <div className="compare__header">
        <button className="compare__back" onClick={() => navigate('/')}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Back
        </button>
        <button className="compare__skip" onClick={() => navigate('/')}>
          Skip
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="compare__question">
        <h1 className="compare__title">Which movie did you like better?</h1>
        <div className="compare__tags">
          {selectedMovie.genres?.map((genre) => (
            <span key={genre.id} className="compare__tag">
              {genre.name}
            </span>
          ))}
        </div>
      </div>

      <div className="compare__cards">
        <button
          className="compare__card"
          onClick={() => handleComparison(selectedMovie)}
        >
          {selectedMovie.poster_path ? (
            <img
              src={getImageUrl(selectedMovie.poster_path, 'w500')}
              alt={selectedMovie.title}
              className="compare__card-poster"
            />
          ) : (
            <div className="compare__card-placeholder">🎬</div>
          )}
          <div className="compare__card-info">
            <h3 className="compare__card-title">{selectedMovie.title}</h3>
            <p className="compare__card-director">
              {selectedMovie.release_date ? new Date(selectedMovie.release_date).getFullYear() : ''}
            </p>
          </div>
        </button>

        <button
          className="compare__card"
          onClick={() => handleComparison(currentMovie)}
        >
          {currentMovie.poster_path ? (
            <img
              src={getImageUrl(currentMovie.poster_path, 'w500')}
              alt={currentMovie.title}
              className="compare__card-poster"
            />
          ) : (
            <div className="compare__card-placeholder">🎬</div>
          )}
          <div className="compare__card-info">
            <h3 className="compare__card-title">{currentMovie.title}</h3>
            <p className="compare__card-director">
              {currentMovie.release_date ? new Date(currentMovie.release_date).getFullYear() : ''}
            </p>
          </div>
        </button>
      </div>

      <div className="compare__footer">
        <button className="compare__difficult" onClick={() => setCurrentIndex(currentIndex + 1)}>
          Too Difficult
        </button>
      </div>
    </div>
  );
};

export default Compare;
