# MovieBeli

A mobile-first web application for rating movies through comparison within genres. Built with React + TypeScript + Vite.

## Project Structure

```
moviebeli-app/
├── src/
│   ├── components/     # Reusable React components
│   ├── pages/          # Page components (Home, GenreSelect, Compare)
│   ├── services/       # API services (TMDB integration)
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Helper functions
│   ├── styles/         # Global styles and design tokens
│   ├── types/          # TypeScript type definitions
│   └── data/           # Data models and schemas
├── public/             # Static assets
└── .env                # Environment variables (API keys)
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd moviebeli-app
npm install
```

### 2. Configure TMDB API

1. Get your API key from [TMDB](https://www.themoviedb.org/settings/api)
2. Open `.env` file in the root directory
3. Replace `your_api_key_here` with your actual API key:

```env
VITE_TMDB_API_KEY=your_actual_api_key_here
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Features

- Comparison-based movie rating (no numerical scores)
- Genre-specific movie organization
- TMDB API integration for real movie data
- Mobile-first responsive design
- Dark theme UI

## Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for TMDB API
- **CSS** - Styling (design tokens system)

## Design Reference

See `../core-flow.png` for the complete UI/UX design flow.

## Next Steps

1. Implement movie card components matching design
2. Build genre selection interface
3. Create comparison UI with swipe interactions
4. Implement preference storage
5. Develop relative scoring algorithm
6. Add recommendation preview
