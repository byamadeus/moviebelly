import axios from 'axios';

const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
const BASE_URL = import.meta.env.VITE_TMDB_BASE_URL;
export const IMAGE_BASE_URL = import.meta.env.VITE_TMDB_IMAGE_BASE_URL;

const tmdbClient = axios.create({
  baseURL: BASE_URL,
  params: {
    api_key: API_KEY,
  },
});

export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface Genre {
  id: number;
  name: string;
}

export const tmdbService = {
  // Get list of genres
  getGenres: async (): Promise<Genre[]> => {
    const response = await tmdbClient.get('/genre/movie/list');
    return response.data.genres;
  },

  // Search movies by query
  searchMovies: async (query: string, page: number = 1): Promise<Movie[]> => {
    const response = await tmdbClient.get('/search/movie', {
      params: { query, page },
    });
    return response.data.results;
  },

  // Get movies by genre
  getMoviesByGenre: async (genreId: number, page: number = 1): Promise<Movie[]> => {
    const response = await tmdbClient.get('/discover/movie', {
      params: {
        with_genres: genreId,
        page,
        sort_by: 'popularity.desc',
      },
    });
    return response.data.results;
  },

  // Get movie details
  getMovieDetails: async (movieId: number): Promise<Movie> => {
    const response = await tmdbClient.get(`/movie/${movieId}`);
    return response.data;
  },

  // Get popular movies
  getPopularMovies: async (page: number = 1): Promise<Movie[]> => {
    const response = await tmdbClient.get('/movie/popular', {
      params: { page },
    });
    return response.data.results;
  },
};

// Helper to get full image URL
export const getImageUrl = (path: string | null, size: string = 'w500'): string => {
  if (!path) return '/placeholder-movie.png';
  return `${IMAGE_BASE_URL}/${size}${path}`;
};
