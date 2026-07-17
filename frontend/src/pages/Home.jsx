import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, BookOpen, Search, ArrowRight, ShieldCheck, Share2, Eye, Compass } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';

export default function Home() {
  const { language } = useAnalysisStore();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resize = () => {
      if (!canvas.parentElement) return;
      canvas.width = canvas.parentElement.scrollWidth || window.innerWidth;
      canvas.height = canvas.parentElement.scrollHeight || document.documentElement.scrollHeight;
    };

    resize();
    window.addEventListener('resize', resize);
    // Extra safety update after a short delay to account for layouts settling
    const timer = setTimeout(resize, 300);

    // Dotted particle field
    const dotsCount = 75;
    const dots = [];
    const colors = ['#facc15', '#22d3ee', '#f472b6']; // Theme Stark Yellow, Cyan, Pink

    for (let i = 0; i < dotsCount; i++) {
      dots.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 2 + 1.2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, w, h);

      // Check current theme
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const lineColor = isLight ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.04)';

      // Draw faint connections between nearby dots
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 0.75;
      for (let i = 0; i < dotsCount; i++) {
        for (let j = i + 1; j < dotsCount; j++) {
          const dx = dots[i].x - dots[j].x;
          const dy = dots[i].y - dots[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.moveTo(dots[i].x, dots[i].y);
            ctx.lineTo(dots[j].x, dots[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw drifting dots
      dots.forEach(dot => {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
        ctx.fillStyle = dot.color;
        ctx.fill();

        // Update positions
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Wrap around borders smoothly
        if (dot.x < -10) dot.x = w + 10;
        if (dot.x > w + 10) dot.x = -10;
        if (dot.y < -10) dot.y = h + 10;
        if (dot.y > h + 10) dot.y = -10;
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(timer);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const supportedTypes = [
    { icon: <Compass size={24} />, titleEn: "News Articles", titleHi: "समाचार लेख", descEn: "Paste plain text of any news article to inspect language framing.", descHi: "भाषा के स्वरूप की जांच करने के लिए किसी भी समाचार लेख का पाठ पेस्ट करें।" },
    { icon: <Search size={24} />, titleEn: "Web URLs", titleHi: "वेब यूआरएल", descEn: "Submit website link to extract content and check domain reputation.", descHi: "सामग्री निकालने और डोमेन प्रतिष्ठा की जांच करने के लिए वेबसाइट लिंक सबमिट करें।" },
    { icon: <Eye size={24} />, titleEn: "Screenshots", titleHi: "स्क्रीनशॉट", descEn: "Upload WhatsApp or social posts images to run OCR reading.", descHi: "ओसीआर रीडिंग चलाने के लिए व्हाट्सएप या सोशल पोस्ट की छवियां अपलोड करें।" },
    { icon: <BookOpen size={24} />, titleEn: "PDF Documents", titleHi: "पीडीएफ दस्तावेज", descEn: "Import PDFs or study reports up to 10MB to cross-verify claims.", descHi: "दावों को सत्यापित करने के लिए 10MB तक की पीडीएफ या अध्ययन रिपोर्ट आयात करें।" }
  ];

  return (
    <div className="animate-fade" style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)', padding: 'var(--space-2xl) 0', overflow: 'hidden' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
      
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>

      {/* Hero Section */}
      <section style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto', padding: 'var(--space-lg) 0' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--space-xs)',
          backgroundColor: 'var(--color-primary-bg)',
          color: 'var(--color-primary)',
          padding: '0.5rem 1rem',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.85rem',
          fontWeight: 600,
          marginBottom: 'var(--space-md)'
        }}>
          <ShieldAlert size={16} />
          <span>{language === 'en' ? 'Cognitive Assistant for Fact-Checking' : 'तथ्य-जांच के लिए संज्ञानात्मक सहायक'}</span>
        </div>
        
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5vw, 4rem)',
          fontWeight: 800,
          letterSpacing: '-0.03em',
          lineHeight: '1.1',
          marginBottom: 'var(--space-md)'
        }}>
          {language === 'en' ? 'Think Before You' : 'साझा करने से पहले'}{' '}
          <span style={{
            background: 'linear-gradient(to right, var(--color-primary), var(--color-danger))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {language === 'en' ? 'Share' : 'सोचें'}
          </span>
          .
        </h1>
        
        <p style={{
          fontSize: 'clamp(1.1rem, 2vw, 1.25rem)',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          marginBottom: 'var(--space-xl)',
          maxWidth: '650px',
          marginLeft: 'auto',
          marginRight: 'auto'
        }}>
          {language === 'en' 
            ? 'TruthLens-AI analyzes news articles, URLs, screenshots, and PDFs. We explain WHY a claim might be misleading, encouraging critical thinking over censorship.'
            : 'ट्रुथलेंस-एआई समाचार लेखों, यूआरएल, स्क्रीनशॉट और पीडीएफ का विश्लेषण करता है। हम समझाते हैं कि कोई दावा क्यों भ्रामक हो सकता है, जिससे सेंसरशिप के बजाय आलोचनात्मक सोच को बढ़ावा मिलता है।'}
        </p>
        
        <div style={{ display: 'flex', gap: 'var(--space-md)', justifyContent: 'center' }}>
          <Link to="/analyze" className="btn btn-primary btn-large">
            {language === 'en' ? 'Start Free Analysis' : 'मुफ़्त विश्लेषण शुरू करें'}
            <ArrowRight size={18} />
          </Link>
          <Link to="/about" className="btn btn-secondary btn-large">
            {language === 'en' ? 'How it Works' : 'यह कैसे काम करता है'}
          </Link>
        </div>
      </section>

      {/* Inputs Overview */}
      <section className="container">
        <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', fontSize: '1.75rem' }}>
          {language === 'en' ? 'Supported Analysis Formats' : 'समर्थित विश्लेषण प्रारूप'}
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 'var(--space-lg)'
        }}>
          {supportedTypes.map((type, idx) => (
            <div key={idx} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
              <div style={{
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-primary-bg)',
                padding: 'var(--space-sm)',
                borderRadius: 'var(--radius-md)',
                width: 'fit-content'
              }}>
                {type.icon}
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>
                {language === 'en' ? type.titleEn : type.titleHi}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                {language === 'en' ? type.descEn : type.descHi}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works / 3-Step Flow */}
      <section style={{ backgroundColor: 'var(--bg-secondary)', padding: 'var(--space-2xl) 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-2xl)', fontSize: '1.75rem' }}>
            {language === 'en' ? 'The Verification Journey' : 'सत्यापन प्रक्रिया'}
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-xl)',
            position: 'relative'
          }}>
            {/* Step 1 */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                border: '1px solid var(--border-color)'
              }}>1</div>
              <h3 style={{ fontSize: '1.15rem', marginTop: 'var(--space-xs)' }}>
                {language === 'en' ? 'Submit Content' : 'सामग्री जमा करें'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '280px' }}>
                {language === 'en' 
                  ? 'Paste text, links, screenshots, or research PDFs into the tool.' 
                  : 'टूल में टेक्स्ट, लिंक, स्क्रीनशॉट या शोध पीडीएफ पेस्ट करें।'}
              </p>
            </div>

            {/* Step 2 */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                border: '1px solid var(--border-color)'
              }}>2</div>
              <h3 style={{ fontSize: '1.15rem', marginTop: 'var(--space-xs)' }}>
                {language === 'en' ? 'Get Explainable AI Breakdown' : 'व्याख्यात्मक AI विश्लेषण प्राप्त करें'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '280px' }}>
                {language === 'en' 
                  ? 'Review trust scoring, factual check links, bias reviews, and emotional indicators.' 
                  : 'ट्रस्ट स्कोरिंग, तथ्य-जांच लिंक, पूर्वाग्रह समीक्षा और भावनात्मक संकेतकों की समीक्षा करें।'}
              </p>
            </div>

            {/* Step 3 */}
            <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--bg-tertiary)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.25rem',
                border: '1px solid var(--border-color)'
              }}>3</div>
              <h3 style={{ fontSize: '1.15rem', marginTop: 'var(--space-xs)' }}>
                {language === 'en' ? 'Reflect & Share Responsibility' : 'सोचें और जिम्मेदारी से साझा करें'}
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', maxWidth: '280px' }}>
                {language === 'en' 
                  ? 'Pause and read our "Before You Share" alerts, copying a clean summary containing sources.' 
                  : 'रुकें और हमारे "साझा करने से पहले सोचें" चेतावनियों को पढ़ें, जिसमें स्रोतों के साथ एक स्पष्ट सारांश होता है।'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Trust section */}
      <section className="container" style={{ padding: 'var(--space-md) 0' }}>
        <div className="glass-card" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 'var(--space-xl)',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ fontSize: '1.75rem', marginBottom: 'var(--space-md)' }}>
              {language === 'en' ? 'Why Trust TruthLens-AI?' : 'ट्रुथलेंस-एआई पर क्यों भरोसा करें?'}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <ShieldCheck size={24} color="var(--color-success)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
                    {language === 'en' ? 'Transparent Citations' : 'पारदर्शी उद्धरण'}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {language === 'en' 
                      ? 'We connect you directly to fact-check organizations and official reports. No hidden algorithms.' 
                      : 'हम आपको सीधे तथ्य-जांच संगठनों और आधिकारिक रिपोर्टों से जोड़ते हैं। कोई छिपा हुआ एल्गोरिदम नहीं है।'}
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
                <Share2 size={24} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '4px' }}>
                    {language === 'en' ? 'Privacy-First Verification' : 'गोपनीयता-प्रथम सत्यापन'}
                  </h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    {language === 'en' 
                      ? 'Guest check history is never saved or tracked. You have full control over your analysis logs.' 
                      : 'अतिथि जांच इतिहास को कभी भी सहेजा या ट्रैक नहीं किया जाता है। आपके पास अपने विश्लेषण लॉग पर पूरा नियंत्रण है।'}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{
              position: 'relative',
              padding: 'var(--space-xl)',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-color)',
              maxWidth: '380px'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {language === 'en' ? 'Our Promise' : 'हमारा वादा'}
              </span>
              <p style={{ fontFamily: 'var(--font-display)', fontWeight: 500, fontSize: '1.2rem', marginTop: 'var(--space-sm)', fontStyle: 'italic', lineHeight: '1.4' }}>
                "{language === 'en' 
                  ? 'We do not tell you what is right or wrong. We provide facts, verify claims, highlight bias, and invite you to think for yourself.' 
                  : 'हम आपको यह नहीं बताते कि क्या सही है या गलत। हम तथ्य प्रदान करते हैं, दावों को सत्यापित करते हैं, पूर्वाग्रहों को उजागर करते हैं और आपको खुद सोचने के लिए आमंत्रित करते हैं।'}"
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
    </div>
  );
}
