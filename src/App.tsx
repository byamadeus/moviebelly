import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Find from './pages/Find';
import Rate from './pages/Rate';
import Compare from './pages/Compare';
import './styles/global.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Find />} />
        <Route path="/rate/:movieId" element={<Rate />} />
        <Route path="/compare/:movieId" element={<Compare />} />
      </Routes>
    </Router>
  );
}

export default App;
