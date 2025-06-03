import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Messenger from './pages/Messenger';
import NotFound from './pages/NotFound';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <Router>
      <AuthProvider>
        <LanguageSwitcher aria-label="Selector de idioma" />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/messenger" element={
            <ProtectedRoute>
              <Messenger />
            </ProtectedRoute>
          } />
          <Route path="/messenger/:conversationId" element={
            <ProtectedRoute>
              <Messenger />
            </ProtectedRoute>
          } />
          <Route path="/" element={<Navigate to="/messenger" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;