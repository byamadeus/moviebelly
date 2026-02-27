import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UserProvider } from './contexts/UserContext';
import Find from './pages/Find';
import Rate from './pages/Rate';
import Compare from './pages/Compare';
import Profile from './pages/Profile';
import Placement from './pages/Placement';
import './styles/global.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Find />} />
          <Route path="/rate/:movieId" element={<Rate />} />
          <Route path="/compare/:movieId" element={<Compare />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/placement/:movieId/:genreKey" element={<Placement />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}

export default App;
