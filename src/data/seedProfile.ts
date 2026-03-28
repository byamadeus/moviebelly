// Seed profile — updated for the global-rank schema (Phase 4)
// Uses flat rank fields; no genre-per-genre ratingContexts.

import type { UserProfile, RatedMovie, Comparison } from '../types/profile';

const now = Date.now();
const day = 86400000;

function movie(
  tmdbId: number,
  title: string,
  posterPath: string,
  releaseDate: string,
  genreNames: string[],
  rank: number,
  total: number
): RatedMovie {
  return {
    tmdbId,
    title,
    posterPath,
    backdropPath: null,
    releaseDate,
    overview: '',
    tmdbGenreIds: [],
    tmdbGenreNames: genreNames,
    addedAt: now - Math.floor(Math.random() * 14) * day,
    lastUpdatedAt: now - Math.floor(Math.random() * 3) * day,
    rank,
    totalRanked: total,
    placedAt: now - Math.floor(Math.random() * 7) * day,
    placementHistory: [],
  };
}

const TOTAL = 20;

const seedMovies: RatedMovie[] = [
  movie(157336, 'Interstellar',                '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', '2014-11-05', ['Science Fiction', 'Drama'], 1, TOTAL),
  movie(240,    'The Godfather',               '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', '1972-03-14', ['Crime', 'Drama'],             2, TOTAL),
  movie(278,    'The Shawshank Redemption',    '/9cjIGRiQoJdBrMlFUY6pShr25kB.jpg', '1994-09-23', ['Drama'],                      3, TOTAL),
  movie(569094, 'Spider-Man: Across the Spider-Verse', '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', '2023-05-31', ['Animation', 'Action'], 4, TOTAL),
  movie(155,    'The Dark Knight',             '/qJ2tW6WMUDux911BTUgMe1nS5Gf.jpg', '2008-07-16', ['Action', 'Crime', 'Drama'],    5, TOTAL),
  movie(27205,  'Inception',                   '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', '2010-07-15', ['Action', 'Science Fiction'],   6, TOTAL),
  movie(324857, 'Spider-Man: Into the Spider-Verse', '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', '2018-12-06', ['Animation', 'Action'],  7, TOTAL),
  movie(603,    'The Matrix',                  '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', '1999-03-30', ['Action', 'Science Fiction'],   8, TOTAL),
  movie(550,    'Fight Club',                  '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', '1999-10-15', ['Drama', 'Thriller'],           9, TOTAL),
  movie(120467, 'The Grand Budapest Hotel',    '/eWDyYaBSavr1uNbpMXTqJAIBwzB.jpg', '2014-02-26', ['Comedy', 'Drama'],            10, TOTAL),
  movie(862,    'Toy Story',                   '/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg', '1995-10-30', ['Animation', 'Comedy'],        11, TOTAL),
  movie(13,     'Forrest Gump',                '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', '1994-07-06', ['Drama', 'Comedy'],            12, TOTAL),
  movie(508442, 'Soul',                        '/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', '2020-12-25', ['Animation', 'Comedy', 'Drama'],13, TOTAL),
  movie(438631, 'Dune',                        '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', '2021-09-15', ['Science Fiction', 'Drama'],   14, TOTAL),
  movie(508947, 'Turning Red',                 '/qsdjk9oAKSQMWs0Vt5Pyfh6O4GZ.jpg', '2022-03-10', ['Animation', 'Comedy'],        15, TOTAL),
  movie(346698, 'Barbie',                      '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', '2023-07-19', ['Comedy', 'Fantasy'],          16, TOTAL),
  movie(515042, 'Free Guy',                    '/xmbU4JTUm8rsdtn7Y3Fcm30GpeT.jpg', '2021-08-11', ['Comedy', 'Action'],           17, TOTAL),
  movie(353486, 'Jumanji: Welcome to the Jungle', '/bXrZ5iHBEjH7WMidbUDQ0U2xbmr.jpg', '2017-12-20', ['Comedy', 'Action'],      18, TOTAL),
  movie(76600,  'Avatar: The Way of Water',    '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', '2022-12-14', ['Action', 'Science Fiction'],  19, TOTAL),
  movie(823464, 'Godzilla x Kong: The New Empire', '/z1p34vh7dEOnLDV8hd28GR1PrxI.jpg', '2024-03-27', ['Action', 'Science Fiction'], 20, TOTAL),
];

const seedComparisons: Omit<Comparison, 'id'>[] = [
  { timestamp: now - 10 * day, movieAId: 155,    movieBId: 550,    winnerId: 155,    isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 10 * day, movieAId: 155,    movieBId: 27205,  winnerId: 155,    isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 9  * day, movieAId: 240,    movieBId: 278,    winnerId: 240,    isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 9  * day, movieAId: 278,    movieBId: 13,     winnerId: 278,    isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 8  * day, movieAId: 120467, movieBId: 515042, winnerId: 120467, isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 7  * day, movieAId: 157336, movieBId: 603,    winnerId: 157336, isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 6  * day, movieAId: 569094, movieBId: 862,    winnerId: 569094, isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 5  * day, movieAId: 324857, movieBId: 508442, winnerId: 324857, isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 4  * day, movieAId: 157336, movieBId: 438631, winnerId: 157336, isDissimilarSignal: false, isSkip: false },
  { timestamp: now - 3  * day, movieAId: 240,    movieBId: 157336, winnerId: 240,    isDissimilarSignal: false, isSkip: false },
];

export function createSeedProfile(): UserProfile {
  return {
    id: 'seed-user-001',
    displayName: 'Seed User',
    email: 'seed@example.com',
    photoURL: null,
    createdAt: now - 14 * day,
    lastUpdated: now,
    friendIds: [],
    visibility: 'friends',
    customGenres: [],
    movieCount: seedMovies.length,
    comparisonCount: seedComparisons.length,
    watchlist: [],
  };
}

export { seedMovies, seedComparisons };
