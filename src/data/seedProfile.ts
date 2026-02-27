// Hardcoded seed profile with ~20 movies across 4 genres
// Pre-calculated Elo scores and simulated comparison history
// No API calls needed — uses known TMDB IDs and poster paths

import type { UserProfile, RatedMovie, Comparison } from '../types/profile';

const now = Date.now();
const day = 86400000;

function movie(
  tmdbId: number,
  title: string,
  posterPath: string,
  releaseDate: string,
  genreLabels: string[],
  eloByGenre: Record<string, number>
): RatedMovie {
  return {
    tmdbId,
    title,
    posterPath,
    backdropPath: null,
    releaseDate,
    overview: '',
    tmdbGenreIds: [],
    userGenres: genreLabels,
    eloRatings: genreLabels.map((g) => ({
      genreKey: g.toLowerCase(),
      genreLabel: g,
      eloScore: eloByGenre[g] ?? 1500,
      comparisons: 4,
      wins: Math.round(((eloByGenre[g] ?? 1500) - 1400) / 25),
      losses: 4 - Math.round(((eloByGenre[g] ?? 1500) - 1400) / 25),
    })),
    addedAt: now - Math.floor(Math.random() * 14) * day,
    lastComparedAt: now - Math.floor(Math.random() * 3) * day,
  };
}

const seedMovies: RatedMovie[] = [
  // ─── Action ───
  movie(550, 'Fight Club', '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', '1999-10-15',
    ['Action', 'Drama'], { Action: 1580, Drama: 1540 }),
  movie(155, 'The Dark Knight', '/qJ2tW6WMUDux911BTUgMe1nS5Gf.jpg', '2008-07-16',
    ['Action', 'Drama'], { Action: 1620, Drama: 1510 }),
  movie(27205, 'Inception', '/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg', '2010-07-15',
    ['Action', 'Sci-Fi'], { Action: 1560, 'Sci-Fi': 1590 }),
  movie(240, 'The Godfather', '/3bhkrj58Vtu7enYsRolD1fZdja1.jpg', '1972-03-14',
    ['Action', 'Drama'], { Action: 1440, Drama: 1630 }),
  movie(76600, 'Avatar: The Way of Water', '/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', '2022-12-14',
    ['Action', 'Sci-Fi'], { Action: 1480, 'Sci-Fi': 1470 }),

  // ─── Comedy ───
  movie(120467, 'The Grand Budapest Hotel', '/eWDyYaBSavr1uNbpMXTqJAIBwzB.jpg', '2014-02-26',
    ['Comedy', 'Drama'], { Comedy: 1590, Drama: 1550 }),
  movie(515042, 'Free Guy', '/xmbU4JTUm8rsdtn7Y3Fcm30GpeT.jpg', '2021-08-11',
    ['Comedy', 'Action'], { Comedy: 1510, Action: 1460 }),
  movie(353486, 'Jumanji: Welcome to the Jungle', '/bXrZ5iHBEjH7WMidbUDQ0U2xbmr.jpg', '2017-12-20',
    ['Comedy', 'Action'], { Comedy: 1470, Action: 1430 }),
  movie(508947, 'Turning Red', '/qsdjk9oAKSQMWs0Vt5Pyfh6O4GZ.jpg', '2022-03-10',
    ['Comedy', 'Animation'], { Comedy: 1530, Animation: 1560 }),
  movie(346698, 'Barbie', '/iuFNMS8U5cb6xfzi51Dbkovj7vM.jpg', '2023-07-19',
    ['Comedy'], { Comedy: 1450 }),

  // ─── Drama ───
  movie(278, 'The Shawshank Redemption', '/9cjIGRiQoJdBrMlFUY6pShr25kB.jpg', '1994-09-23',
    ['Drama'], { Drama: 1610 }),
  movie(13, 'Forrest Gump', '/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', '1994-07-06',
    ['Drama', 'Comedy'], { Drama: 1570, Comedy: 1520 }),
  movie(569094, 'Spider-Man: Across the Spider-Verse', '/8Vt6mWEReuy4Of61Lnj5Xj704m8.jpg', '2023-05-31',
    ['Animation', 'Action'], { Animation: 1610, Action: 1550 }),
  movie(862, 'Toy Story', '/uXDfjJbdP4ijW5hWSBrPrlKpxab.jpg', '1995-10-30',
    ['Animation', 'Comedy'], { Animation: 1580, Comedy: 1540 }),

  // ─── Sci-Fi ───
  movie(157336, 'Interstellar', '/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', '2014-11-05',
    ['Sci-Fi', 'Drama'], { 'Sci-Fi': 1620, Drama: 1580 }),
  movie(603, 'The Matrix', '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg', '1999-03-30',
    ['Sci-Fi', 'Action'], { 'Sci-Fi': 1570, Action: 1540 }),
  movie(438631, 'Dune', '/d5NXSklXo0qyIYkgV94XAgMIckC.jpg', '2021-09-15',
    ['Sci-Fi', 'Drama'], { 'Sci-Fi': 1550, Drama: 1490 }),
  movie(823464, 'Godzilla x Kong: The New Empire', '/z1p34vh7dEOnLDV8hd28GR1PrxI.jpg', '2024-03-27',
    ['Sci-Fi', 'Action'], { 'Sci-Fi': 1420, Action: 1450 }),

  // ─── Animation ───
  movie(508442, 'Soul', '/hm58Jw4Lw8OIeECIq5qyPYhAeRJ.jpg', '2020-12-25',
    ['Animation', 'Comedy', 'Drama'], { Animation: 1550, Comedy: 1490, Drama: 1500 }),
  movie(324857, 'Spider-Man: Into the Spider-Verse', '/iiZZdoQBEYBv6id8su7ImL0oCbD.jpg', '2018-12-06',
    ['Animation', 'Action'], { Animation: 1600, Action: 1560 }),
];

// Simulated comparison history
const seedComparisons: Omit<Comparison, 'id'>[] = [
  { timestamp: now - 10 * day, genreContext: 'action', winnerTmdbId: 155, loserTmdbId: 550, winnerNewElo: 1520, loserNewElo: 1480 },
  { timestamp: now - 10 * day, genreContext: 'action', winnerTmdbId: 155, loserTmdbId: 27205, winnerNewElo: 1540, loserNewElo: 1460 },
  { timestamp: now - 9 * day, genreContext: 'drama', winnerTmdbId: 240, loserTmdbId: 278, winnerNewElo: 1520, loserNewElo: 1480 },
  { timestamp: now - 9 * day, genreContext: 'drama', winnerTmdbId: 278, loserTmdbId: 13, winnerNewElo: 1530, loserNewElo: 1470 },
  { timestamp: now - 8 * day, genreContext: 'comedy', winnerTmdbId: 120467, loserTmdbId: 515042, winnerNewElo: 1530, loserNewElo: 1470 },
  { timestamp: now - 7 * day, genreContext: 'sci-fi', winnerTmdbId: 157336, loserTmdbId: 603, winnerNewElo: 1530, loserNewElo: 1470 },
  { timestamp: now - 6 * day, genreContext: 'animation', winnerTmdbId: 569094, loserTmdbId: 862, winnerNewElo: 1530, loserNewElo: 1470 },
  { timestamp: now - 5 * day, genreContext: 'animation', winnerTmdbId: 324857, loserTmdbId: 508442, winnerNewElo: 1530, loserNewElo: 1470 },
  { timestamp: now - 4 * day, genreContext: 'sci-fi', winnerTmdbId: 157336, loserTmdbId: 438631, winnerNewElo: 1560, loserNewElo: 1440 },
  { timestamp: now - 3 * day, genreContext: 'drama', winnerTmdbId: 240, loserTmdbId: 157336, winnerNewElo: 1560, loserNewElo: 1440 },
];

export function createSeedProfile(): UserProfile {
  return {
    id: 'seed-user-001',
    createdAt: now - 14 * day,
    lastUpdated: now,
    moviesSeen: seedMovies,
    comparisons: seedComparisons.map((c, i) => ({
      ...c,
      id: `seed-comp-${i}`,
    })),
    customGenres: ['Family Movie Night', 'Mind Bending'],
  };
}
