import { useNavigate } from 'react-router-dom';
import MovieSearch from '../components/MovieSearch';
import type { Movie } from '../services/tmdb';
import './Home.css';

const Home = () => {
  const navigate = useNavigate();

  const handleMovieSelect = (movie: Movie) => {
    // Navigate to comparison with the selected movie
    navigate(`/compare/${movie.id}`);
  };

  return (
    <div className="home">
      <div className="home__content">
        <div className="home__hero">
          <h1 className="home__title">MovieBeli</h1>
          <p className="home__tagline">
            Rate movies by comparison, discover what you really love
          </p>
        </div>

        <div className="home__search-section">
          <h2 className="home__search-title">What movie did you just watch?</h2>
          <MovieSearch onMovieSelect={handleMovieSelect} />
          <p className="home__search-hint">
            We'll help you rate it against similar movies
          </p>
        </div>

        <div className="home__features">
          <div className="home__feature">
            <div className="home__feature-icon">🎬</div>
            <h3 className="home__feature-title">No Numbers</h3>
            <p className="home__feature-text">
              Just compare movies you like more
            </p>
          </div>

          <div className="home__feature">
            <div className="home__feature-icon">🎯</div>
            <h3 className="home__feature-title">Genre Focused</h3>
            <p className="home__feature-text">
              Rate within genres for better insights
            </p>
          </div>

          <div className="home__feature">
            <div className="home__feature-icon">✨</div>
            <h3 className="home__feature-title">Smart Recommendations</h3>
            <p className="home__feature-text">
              Discover movies based on your taste
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
