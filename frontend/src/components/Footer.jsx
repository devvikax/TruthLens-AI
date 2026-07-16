import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Heart } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';

export default function Footer() {
  const { language } = useAnalysisStore();

  return (
    <footer style={{
      backgroundColor: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      padding: 'var(--space-2xl) 0 var(--space-xl) 0',
      marginTop: 'auto'
    }}>
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 'var(--space-xl)',
          marginBottom: 'var(--space-xl)'
        }}>
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-sm)' }}>
              <ShieldCheck size={24} color="var(--color-primary)" />
              <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.1rem' }}>TruthLens AI</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-md)', maxWidth: '300px' }}>
              {language === 'en' 
                ? 'Empowering citizens, students, and journalists to evaluate digital media, detect bias, and think before they share.'
                : 'नागरिकों, छात्रों और पत्रकारों को डिजिटल मीडिया का मूल्यांकन करने, पूर्वाग्रहों का पता लगाने और साझा करने से पहले सोचने में सक्षम बनाना।'}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
              {language === 'en' ? 'Quick Actions' : 'त्वरित लिंक'}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <Link to="/analyze" style={{ hover: 'color: var(--color-primary)' }}>
                {language === 'en' ? 'Analyze Content' : 'सामग्री का विश्लेषण'}
              </Link>
              <Link to="/history" style={{ hover: 'color: var(--color-primary)' }}>
                {language === 'en' ? 'Search History' : 'खोज इतिहास'}
              </Link>
              <Link to="/about" style={{ hover: 'color: var(--color-primary)' }}>
                {language === 'en' ? 'FAQ & Mission' : 'अक्सर पूछे जाने वाले प्रश्न'}
              </Link>
            </div>
          </div>

          {/* Legal / Ethics */}
          <div>
            <h4 style={{ fontSize: '1rem', marginBottom: 'var(--space-md)' }}>
              {language === 'en' ? 'Disclaimer' : 'अस्वीकरण'}
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
              {language === 'en' 
                ? 'TruthLens AI is an educational analysis platform. We do not censor content or make absolute verdicts. We encourage users to verify details from official portals before sharing.'
                : 'ट्रुथलेंस एआई एक शैक्षिक विश्लेषण मंच है। हम सामग्री को सेंसर नहीं करते हैं या पूर्ण निर्णय नहीं देते हैं। हम उपयोगकर्ताओं को साझा करने से पहले आधिकारिक पोर्टलों से विवरणों को सत्यापित करने के लिए प्रोत्साहित करते हैं।'}
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: '1px solid var(--border-color)',
          paddingTop: 'var(--space-md)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--space-md)',
          fontSize: '0.85rem',
          color: 'var(--text-muted)'
        }}>
          <span>&copy; {new Date().getFullYear()} TruthLens AI. All rights reserved.</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {language === 'en' ? 'Think Before You Share' : 'साझा करने से पहले सोचें'}
            <Heart size={12} color="var(--color-danger)" fill="var(--color-danger)" />
          </span>
        </div>
      </div>
    </footer>
  );
}
