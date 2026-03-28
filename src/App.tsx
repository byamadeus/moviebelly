import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserProvider } from './contexts/UserContext';
import Find from './pages/Find';
import Rate from './pages/Rate';
import Compare from './pages/Compare';
import Profile from './pages/Profile';
import Placement from './pages/Placement';
import Login from './pages/Login';
import './styles/global.css';

// Wraps routes that require authentication
function ProtectedRoutes() {
  const { firebaseUser, authLoading } = useAuth();

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0A0B14',
      }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #5B7FFF', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (!firebaseUser) {
    return <Login />;
  }

  return (
    <UserProvider>
      <Routes>
        <Route path="/" element={<Find />} />
        <Route path="/rate/:movieId" element={<Rate />} />
        <Route path="/compare/:movieId" element={<Compare />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/placement/:movieId" element={<Placement />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </UserProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <ProtectedRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
