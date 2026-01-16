import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GenreCard from '../components/GenreCard';
import { tmdbService } from '../services/tmdb';
import type { Genre } from '../services/tmdb';
import './GenreSelect.css';

const GenreSelect = () => {
  const navigate = useNavigate();
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const fetchedGenres = await tmdbService.getGenres();
        setGenres(fetchedGenres);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch genres:', error);
        setLoading(false);
      }
    };

    fetchGenres();
  }, []);

  const handleGenreSelect = (genreId: number) => {
    navigate(`/compare/${genreId}`);
  };

  if (loading) {
    return (
      <div className="genre-select__loading">
        Loading genres...
      </div>
    );
  }

  return (
    <div className="genre-select">
      <div className="genre-select__header">
        <h1 className="genre-select__title">Choose a Genre</h1>
        <p className="genre-select__subtitle">
          Start rating movies in your favorite genre
        </p>
      </div>

      <div className="genre-select__list">
        {genres.map((genre) => (
          <GenreCard
            key={genre.id}
            id={genre.id}
            name={genre.name}
            onClick={() => handleGenreSelect(genre.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default GenreSelect;
