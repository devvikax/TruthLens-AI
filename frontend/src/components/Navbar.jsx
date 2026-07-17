import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Sun, Moon, Languages, Menu, X, ShieldCheck } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';

export default function Navbar() {
  const { theme, setTheme, language, setLanguage, isAuthenticated, user, logoutUser } = useAnalysisStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Initialize theme attribute on first load
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const menuItems = [
    { path: '/', labelEn: 'Home', labelHi: 'होम' },
    { path: '/analyze', labelEn: 'Analyze', labelHi: 'विश्लेषण' },
    { path: '/history', labelEn: 'History', labelHi: 'इतिहास' },
    { path: '/about', labelEn: 'About', labelHi: 'हमारे बारे में' }
  ];

  return (
    <header className="glass" style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      borderBottom: '1px solid var(--border-color)',
      padding: '0.75rem 0'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }} onClick={() => setMobileMenuOpen(false)}>
          <ShieldCheck size={28} color="var(--color-primary)" />
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.25rem',
            letterSpacing: '-0.02em',
            background: 'linear-gradient(to right, var(--color-primary), var(--text-primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            TruthLens-AI
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-lg)' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  fontSize: '0.95rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: 'var(--radius-xs)',
                  transition: 'color var(--transition-fast)'
                }}
              >
                {language === 'en' ? item.labelEn : item.labelHi}
              </Link>
            );
          })}
        </nav>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          {/* Language Switch */}
          <button 
            onClick={toggleLanguage} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem 0.75rem', fontSize: '0.85rem' }}
            title="Toggle Language / भाषा बदलें"
            aria-label="Toggle Language"
          >
            <Languages size={16} />
            <span style={{ marginLeft: '4px' }}>{language === 'en' ? 'Hindi' : 'English'}</span>
          </button>

          {/* Theme Toggle */}
          <button 
            onClick={toggleTheme} 
            className="btn btn-secondary" 
            style={{ padding: '0.5rem', borderRadius: 'var(--radius-full)' }}
            title="Toggle Dark/Light Mode"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>


          {/* Hamburger Icon */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
            className="mobile-toggle btn btn-secondary" 
            style={{ display: 'none', padding: '0.5rem' }}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-menu animate-fade" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          background: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          padding: 'var(--space-md) var(--space-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  fontSize: '1rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--color-primary)' : 'var(--text-primary)',
                  padding: '0.5rem 0'
                }}
              >
                {language === 'en' ? item.labelEn : item.labelHi}
              </Link>
            );
          })}

        </div>
      )}

      {/* Desktop vs Mobile Toggle display rules */}
      <style>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-toggle {
            display: flex !important;
          }
        }
      `}</style>
    </header>
  );
}
