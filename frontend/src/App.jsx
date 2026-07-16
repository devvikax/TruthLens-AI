import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Analysis from './pages/Analysis';
import Results from './pages/Results';
import About from './pages/About';
import Auth from './pages/Auth';
import History from './pages/History';
import Profile from './pages/Profile';
import { ToastProvider } from './context/ToastContext';
import { useAnalysisStore } from './store/analysisStore';

export default function App() {
  const { loadUserSession } = useAnalysisStore();

  useEffect(() => {
    loadUserSession();
  }, [loadUserSession]);
  return (
    <ToastProvider>
      <Router>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-primary)',
          transition: 'background-color var(--transition-normal), color var(--transition-normal)'
        }}>
          {/* Global Header */}
          <Navbar />

          {/* Page Routing Contents */}
          <main style={{ flex: '1 0 auto', paddingBottom: 'var(--space-2xl)' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/analyze" element={<Analysis />} />
              <Route path="/results" element={<Results />} />
              <Route path="/about" element={<About />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/history" element={<History />} />
              <Route path="/profile" element={<Profile />} />
            </Routes>
          </main>

          {/* Global Footer */}
          <Footer />
        </div>
      </Router>
    </ToastProvider>
  );
}
