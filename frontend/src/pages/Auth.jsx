import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Mail, User, ShieldCheck } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import { useToast } from '../context/ToastContext';

export default function Auth() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { registerUser, loginUser, language } = useAnalysisStore();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      showToast(
        language === 'en' ? 'Please fill out all fields.' : 'कृपया सभी फ़ील्ड भरें।', 
        'danger'
      );
      return;
    }

    setLoading(true);
    let res;
    if (isLogin) {
      res = await loginUser(email, password);
    } else {
      res = await registerUser(name, email, password);
    }
    setLoading(false);

    if (res.success) {
      showToast(
        isLogin 
          ? (language === 'en' ? 'Welcome back!' : 'वापसी पर स्वागत है!')
          : (language === 'en' ? 'Account created successfully!' : 'खाता सफलतापूर्वक बनाया गया!'),
        'success'
      );
      navigate('/history');
    } else {
      showToast(res.message, 'danger');
    }
  };

  const handleGoogleOAuth = () => {
    // google OAuth mock triggers
    localStorage.setItem('user_authenticated', 'true');
    localStorage.setItem('user_profile', JSON.stringify({ name: 'Google User', email: 'user@google.com' }));
    useAnalysisStore.setState({ isAuthenticated: true, user: { name: 'Google User', email: 'user@google.com' } });
    showToast(
      language === 'en' ? 'Signed in with Google!' : 'गूगल के साथ लॉगिन सफल!',
      'success'
    );
    navigate('/history');
  };

  return (
    <div className="container animate-fade" style={{ padding: 'var(--space-2xl) 0', display: 'flex', justifyContent: 'center' }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
          <ShieldCheck size={36} color="var(--color-primary)" style={{ margin: '0 auto var(--space-xs) auto' }} />
          <h2 style={{ fontSize: '1.5rem' }}>
            {isLogin 
              ? (language === 'en' ? 'Sign In to TruthLens' : 'ट्रुथलेंस में साइन इन करें')
              : (language === 'en' ? 'Create Free Account' : 'मुफ़्त खाता बनाएं')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            {language === 'en' 
              ? 'Save your verification history and sync across devices.' 
              : 'अपना सत्यापन इतिहास सहेजें और उपकरणों में सिंक करें।'}
          </p>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          border: '1px solid var(--border-color)'
        }}>
          <button
            onClick={() => setIsLogin(true)}
            className="btn"
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: isLogin ? 'var(--bg-secondary)' : 'transparent',
              color: isLogin ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem'
            }}
          >
            {language === 'en' ? 'Login' : 'लॉगिन'}
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className="btn"
            style={{
              flex: 1,
              padding: '0.5rem',
              backgroundColor: !isLogin ? 'var(--bg-secondary)' : 'transparent',
              color: !isLogin ? 'var(--color-primary)' : 'var(--text-secondary)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.9rem'
            }}
          >
            {language === 'en' ? 'Register' : 'रजिस्टर'}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          
          {!isLogin && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                {language === 'en' ? 'Full Name' : 'पूरा नाम'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder={language === 'en' ? 'John Doe' : 'जॉन डो'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                  disabled={loading}
                />
                <User size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {language === 'en' ? 'Email Address' : 'ईमेल पता'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              {language === 'en' ? 'Password' : 'पासवर्ड'}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                disabled={loading}
              />
              <KeyRound size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '15px' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--space-xs)' }} disabled={loading}>
            {loading ? (
              <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
            ) : isLogin ? (
              language === 'en' ? 'Sign In' : 'साइन इन करें'
            ) : (
              language === 'en' ? 'Create Account' : 'खाता बनाएं'
            )}
          </button>
        </form>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-sm)',
          fontSize: '0.8rem',
          color: 'var(--text-muted)',
          margin: 'var(--space-xs) 0'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span>{language === 'en' ? 'OR' : 'या'}</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        {/* Google OAuth Button */}
        <button onClick={handleGoogleOAuth} className="btn btn-secondary" style={{ width: '100%' }} disabled={loading}>
          <svg style={{ width: '16px', height: '16px', marginRight: '6px' }} viewBox="0 0 24 24">
            <path fill="currentColor" d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.187 4.114-3.5 0-6.31-2.81-6.31-6.3s2.81-6.3 6.31-6.3c1.55 0 2.97.56 4.07 1.48l3.14-3.14C19.1 2.22 15.89 1 12.24 1 5.75 1 .5 6.25.5 12.75s5.25 11.75 11.74 11.75c7.2 0 11.74-5.06 11.74-11.75 0-.79-.07-1.55-.22-2.285H12.24z"/>
          </svg>
          {language === 'en' ? 'Continue with Google' : 'गूगल के साथ लॉगिन करें'}
        </button>

      </div>
    </div>
  );
}
