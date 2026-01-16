import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GenreSelect from './pages/GenreSelect';
import Compare from './pages/Compare';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/genres" element={<GenreSelect />} />
        <Route path="/compare/:genreId" element={<Compare />} />
      </Routes>
    </Router>
  );
}

export default App;
