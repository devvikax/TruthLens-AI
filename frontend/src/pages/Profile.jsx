import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, ShieldAlert, LogOut, Settings, Languages, Sun, Moon } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { theme, setTheme, language, setLanguage, isAuthenticated, user, logoutUser } = useAnalysisStore();
  
  const [profileName, setProfileName] = useState('Guest User');
  const [profileEmail, setProfileEmail] = useState('guest@truthlens.ai');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      setProfileName(user.name);
      setProfileEmail(user.email);
    }
  }, [isAuthenticated, user]);

  const handleLogout = async () => {
    await logoutUser();
    showToast(
      language === 'en' ? 'Logged out successfully.' : 'सफलतापूर्वक लॉग आउट किया गया।',
      'info'
    );
    navigate('/');
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return;

    setLoading(true);
    try {
      const res = await apiClient.put('/users/profile', { name: profileName });
      useAnalysisStore.setState({ user: res.data.user });
      showToast(
        language === 'en' ? 'Profile preferences saved!' : 'प्रोफ़ाइल प्राथमिकताएं सहेजी गईं!',
        'success'
      );
    } catch (err) {
      showToast(
        language === 'en' ? 'Failed to save settings.' : 'सेटिंग्स सहेजने में विफल।',
        'danger'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container animate-fade" style={{ padding: 'var(--space-2xl) 0', maxWidth: '600px' }}>
      
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-primary)',
            border: '2px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <User size={32} color="var(--color-primary)" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>{profileName}</h2>
            <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
              {isAuthenticated ? (language === 'en' ? 'Verified Member' : 'सत्यापित सदस्य') : (language === 'en' ? 'Guest Mode' : 'अतिथि मोड')}
            </span>
          </div>
        </div>

        {/* Configurations */}
        <form onSubmit={saveSettings} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <h3 style={{ fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={18} />
            <span>{language === 'en' ? 'Account Configurations' : 'खाता विन्यास'}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {language === 'en' ? 'User Name' : 'उपयोगकर्ता नाम'}
            </label>
            <input
              type="text"
              className="input-field"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              disabled={!isAuthenticated || loading}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {language === 'en' ? 'Email Address' : 'ईमेल पता'}
            </label>
            <input
              type="email"
              className="input-field"
              value={profileEmail}
              disabled={true} // Email edit blocked in typical security models
              style={{ opacity: 0.6, cursor: 'not-allowed' }}
            />
          </div>

          {/* Quick preference triggers */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--space-md)',
            padding: 'var(--space-md)',
            backgroundColor: 'var(--bg-primary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            marginTop: 'var(--space-sm)'
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                {language === 'en' ? 'Language Setting' : 'भाषा सेटिंग'}
              </span>
              <button 
                type="button" 
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
              >
                <Languages size={14} style={{ marginRight: '6px' }} />
                {language === 'en' ? 'English' : 'हिंदी'}
              </button>
            </div>

            <div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                {language === 'en' ? 'Theme Style' : 'थीम शैली'}
              </span>
              <button 
                type="button" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="btn btn-secondary"
                style={{ width: '100%', padding: '0.5rem', fontSize: '0.85rem' }}
              >
                {theme === 'dark' ? <Moon size={14} style={{ marginRight: '6px' }} /> : <Sun size={14} style={{ marginRight: '6px' }} />}
                {theme === 'dark' ? (language === 'en' ? 'Dark' : 'डार्क') : (language === 'en' ? 'Light' : 'लाइट')}
              </button>
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
            {isAuthenticated && (
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ flex: 1 }}
                disabled={loading}
              >
                {loading ? 'Saving...' : (language === 'en' ? 'Save Settings' : 'सेटिंग्स सहेजें')}
              </button>
            )}
            
            {isAuthenticated ? (
              <button 
                type="button" 
                onClick={handleLogout} 
                className="btn btn-secondary" 
                style={{ flex: 1, borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
              >
                <LogOut size={16} />
                <span>{language === 'en' ? 'Logout' : 'लॉग आउट'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/auth')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                {language === 'en' ? 'Connect Account / Sign In' : 'खाता कनेक्ट करें / साइन इन'}
              </button>
            )}
          </div>
        </form>

      </div>
    </div>
  );
}
