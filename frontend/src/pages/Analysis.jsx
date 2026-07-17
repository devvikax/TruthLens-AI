import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlignLeft, Link2, Image as ImageIcon, FileText, Play, 
  CheckCircle2, Circle, RefreshCw, HelpCircle, Compass, ShieldCheck, Terminal 
} from 'lucide-react';
import { useAnalysisStore, MOCK_TEMPLATES } from '../store/analysisStore';
import UploadZone from '../components/UploadZone';
import { useToast } from '../context/ToastContext';

export default function Analysis() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { analyzeContent, isAnalyzing, processingSteps, language } = useAnalysisStore();
  
  const [activeTab, setActiveTab] = useState('text'); // 'text', 'url', 'image', 'pdf'
  const [textInput, setTextInput] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Track template selection for mock routing
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('credible');

  // Clarification States
  const [clarificationData, setClarificationData] = useState(null); // { subject, candidates }
  const [selectedCandidate, setSelectedCandidate] = useState('');

  const tabs = [
    { id: 'text', labelEn: 'Paste Text', labelHi: 'टेक्स्ट पेस्ट करें', icon: <AlignLeft size={16} /> },
    { id: 'url', labelEn: 'URL Link', labelHi: 'यूआरएल लिंक', icon: <Link2 size={16} /> },
    { id: 'image', labelEn: 'Upload Screenshot', labelHi: 'स्क्रीनशॉट अपलोड', icon: <ImageIcon size={16} /> },
    { id: 'pdf', labelEn: 'Upload PDF', labelHi: 'पीडीएफ अपलोड', icon: <FileText size={16} /> }
  ];

  // Helper to load templates into the input fields
  const loadExample = (key, overrideTab = null) => {
    setSelectedTemplateKey(key);
    const template = MOCK_TEMPLATES[key];
    const tabToCheck = overrideTab || activeTab;
    
    showToast(
      language === 'en' ? `Loaded "${key}" example!` : `"${key}" उदाहरण लोड किया गया!`, 
      'success'
    );

    if (tabToCheck === 'text') {
      setTextInput(template.rawInput);
    } else if (tabToCheck === 'url') {
      setUrlInput(template.sourceUrl || "https://example-news-outlet.com/story-" + key);
    } else {
      // Mock file selection
      setUploadedFile({
        name: key === 'credible' ? 'nasa_research_report.pdf' : key === 'caution' ? 'whatsapp_forward_os_rumor.png' : 'lemon_soda_cure_claim.jpeg',
        size: key === 'credible' ? 2451234 : 1245000
      });
    }
  };

  // Dedicated one-click reset button
  const resetForm = () => {
    setTextInput('');
    setUrlInput('');
    setUploadedFile(null);
    setClarificationData(null);
    setSelectedCandidate('');
    showToast(
      language === 'en' ? 'Form reset successfully!' : 'फॉर्म सफलतापूर्वक रीसेट हो गया!',
      'success'
    );
  };

  const handleStartAnalysis = async (forcedEntityValue = null) => {
    // Validation
    if (!forcedEntityValue) {
      if (activeTab === 'text') {
        if (!textInput.trim()) {
          showToast(language === 'en' ? 'Please paste some text first.' : 'कृपया पहले कुछ टेक्स्ट पेस्ट करें।', 'danger');
          return;
        }
      } else if (activeTab === 'url') {
        if (!urlInput.trim() || !urlInput.startsWith('http')) {
          showToast(language === 'en' ? 'Please enter a valid website URL.' : 'कृपया एक मान्य वेबसाइट यूआरएल दर्ज करें।', 'danger');
          return;
        }
      } else {
        if (!uploadedFile) {
          showToast(language === 'en' ? 'Please select or drop a file.' : 'कृपया एक फ़ाइल चुनें या ड्रॉप करें।', 'danger');
          return;
        }
      }
    }

    const baseInput = activeTab === 'text' ? textInput : activeTab === 'url' ? urlInput : '';
    // Append forced clarification entity details to query if user confirmed selection
    const finalInputData = forcedEntityValue ? `${baseInput} (Context: verifying specifically about ${forcedEntityValue})` : baseInput;

    const res = await analyzeContent(activeTab, finalInputData, uploadedFile);
    
    if (res.success) {
      navigate('/results');
    } else if (res.requiresClarification) {
      setClarificationData({
        subject: res.subject,
        candidates: res.candidates
      });
      setSelectedCandidate(res.candidates[0] || '');
      showToast(language === 'en' ? 'Multiple entity matches found. Please clarify.' : 'एकाधिक संस्था मिलान मिले। कृपया स्पष्ट करें।', 'warning');
    } else {
      showToast(res.message, 'danger');
    }
  };

  const handleConfirmClarification = () => {
    if (!selectedCandidate) return;
    const forcedValue = selectedCandidate;
    setClarificationData(null);
    handleStartAnalysis(forcedValue);
  };

  // Calculate loading progress percentage dynamically based on active steps
  const getProgressPercent = () => {
    const runningIndex = processingSteps.findIndex(s => s.status === 'running');
    const completedCount = processingSteps.filter(s => s.status === 'completed').length;
    if (completedCount === processingSteps.length) return 100;
    if (runningIndex !== -1) {
      return Math.round(((runningIndex + 0.5) / processingSteps.length) * 100);
    }
    return Math.round((completedCount / processingSteps.length) * 100);
  };
  const progressPercent = getProgressPercent();

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', maxWidth: '850px' }}>
      
      {isAnalyzing ? (
        /* Cyberpunk Holographic Scanning Loader & Console Readout */
        <div style={{ position: 'relative', width: '100%', display: 'flex', justifyContent: 'center' }}>
          {/* Floating background glowing ambient lenses */}
          <div style={{
            position: 'absolute',
            width: '350px',
            height: '350px',
            borderRadius: '50%',
            backgroundColor: 'rgba(0, 102, 255, 0.08)',
            filter: 'blur(90px)',
            top: '0%',
            left: '5%',
            zIndex: -1,
            pointerEvents: 'none'
          }} />
          <div style={{
            position: 'absolute',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: 'rgba(112, 0, 255, 0.06)',
            filter: 'blur(80px)',
            bottom: '0%',
            right: '5%',
            zIndex: -1,
            pointerEvents: 'none'
          }} />

          <div className="glass-card animate-fade" style={{
            textAlign: 'center',
            padding: 'var(--space-2xl)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-xl)',
            width: '100%',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)'
          }}>
            {/* Holographic Spinning Target */}
            <div style={{ position: 'relative', width: '120px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              {/* Outer spinning dash ring */}
              <div className="spin-slow" style={{
                position: 'absolute',
                width: '110px',
                height: '110px',
                borderRadius: '50%',
                border: '2px dashed var(--color-primary)',
                boxShadow: '0 0 15px rgba(0, 102, 255, 0.2)'
              }} />
              
              {/* Inner counter-spinning dot ring */}
              <div style={{
                position: 'absolute',
                width: '85px',
                height: '85px',
                borderRadius: '50%',
                border: '2px dotted var(--color-info)',
                animation: 'spinLoader 6s infinite linear reverse'
              }} />

              {/* Hologram core glow */}
              <div style={{
                position: 'absolute',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(0, 102, 255, 0.12)',
                filter: 'blur(8px)',
                animation: 'pulseGlow 2s infinite ease-in-out'
              }} />

              {/* Center icon */}
              <ShieldCheck size={40} color="var(--color-primary)" style={{ zIndex: 2, filter: 'drop-shadow(0 0 8px var(--color-primary))' }} />
            </div>

            <div>
              <h2 style={{ fontSize: '1.65rem', marginBottom: 'var(--space-xs)', letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Terminal size={20} color="var(--color-primary)" />
                <span className="gradient-text">
                  {language === 'en' ? 'FORENSIC EVIDENCE AUDIT' : 'फॉरेंसिक साक्ष्य ऑडिट'}
                </span>
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto' }}>
                {language === 'en' 
                  ? 'TruthLens-AI intelligence adapters are scraping registries, checking metadata, and indexing wire consensus patterns.' 
                  : 'ट्रुथलेंस-एआई इंटेलिजेंस एडेप्टर रजिस्ट्रियों को स्क्रैप कर रहे हैं, मेटाडेटा की जांच कर रहे हैं, और वायर सर्वसम्मति पैटर्न को अनुक्रमित कर रहे हैं।'}
              </p>
            </div>

            {/* Premium Animated Progress Bar */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              height: '5px',
              backgroundColor: 'var(--bg-tertiary)',
              borderRadius: 'var(--radius-full)',
              overflow: 'hidden',
              margin: '-4px 0 0 0',
              position: 'relative',
              border: '1px solid var(--border-color)'
            }}>
              {/* Moving scanner line effect */}
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundImage: 'linear-gradient(90deg, var(--color-primary) 0%, var(--border-focus) 100%)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 500ms cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: 'var(--shadow-glow)'
              }} />
            </div>

            {/* Monospace Stepper Console Output */}
            <div style={{
              width: '100%',
              maxWidth: '480px',
              textAlign: 'left',
              backgroundColor: '#020617',
              padding: 'var(--space-lg)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.6)'
            }}>
              {processingSteps.map((step, idx) => {
                const simulatedSec = (idx * 6).toString().padStart(2, '0');
                const timestamp = `[05:22:${simulatedSec}]`;
                return (
                  <div 
                    key={step.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--space-sm)',
                      opacity: step.status === 'idle' ? 0.3 : 1,
                      fontFamily: 'monospace',
                      fontSize: '0.8rem',
                      transition: 'opacity var(--transition-fast)'
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)', marginRight: '4px' }}>{timestamp}</span>
                    {step.status === 'completed' ? (
                      <CheckCircle2 size={14} color="var(--color-success)" style={{ flexShrink: 0 }} />
                    ) : step.status === 'running' ? (
                      <div className="loader" style={{ width: '12px', height: '12px', borderWidth: '1.5px', flexShrink: 0 }}></div>
                    ) : (
                      <Circle size={14} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{ 
                      fontWeight: step.status === 'running' ? 700 : 400,
                      color: step.status === 'completed' ? '#10b981' : step.status === 'running' ? 'var(--color-primary)' : 'var(--text-secondary)',
                      letterSpacing: '0.02em'
                    }}>
                      {step.text.toUpperCase()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Submission Forms Page */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-sm)' }}>
            <h1 style={{ fontSize: '2.4rem', marginBottom: 'var(--space-xs)', fontWeight: 800, textTransform: 'uppercase', textShadow: '3px 3px 0px #000000' }}>
              {language === 'en' ? 'Start Content Inspection' : 'सामग्री निरीक्षण शुरू करें'}
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', fontWeight: 500 }}>
              {language === 'en' ? 'Submit raw text, website URLs, documents, or video feeds to investigate credentials.' : 'क्रेडेंशियल्स की जांच करने के लिए टेक्स्ट, वेब पते या दस्तावेज़ कैप्चर सबमिट करें।'}
            </p>
          </div>

          {/* Curated Demo Mode Panel (resettable sandbox) */}
          <div className="glass-card" style={{
            border: '3px solid #000000',
            backgroundColor: 'var(--bg-secondary)',
            boxShadow: '6px 6px 0px #000000',
            padding: 'var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Compass size={20} color="var(--color-primary)" style={{ filter: 'drop-shadow(1.5px 1.5px 0px #000000)' }} />
                <strong style={{ fontSize: '1.05rem', color: 'var(--text-primary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {language === 'en' ? 'TruthLens-AI Curated Demo Sandbox' : 'ट्रुथलेंस-एआई डेमो सैंडबॉक्स'}
                </strong>
              </div>
              <button 
                onClick={resetForm}
                className="btn btn-secondary" 
                style={{ padding: '6px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: 'var(--color-info)' }}
              >
                <RefreshCw size={12} />
                <span>{language === 'en' ? 'Reset Sandbox' : 'रीसेट सैंडबॉक्स'}</span>
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', fontWeight: 500, margin: 0 }}>
              {language === 'en'
                ? 'Quick-test TruthLens-AI using curated sample credentials. Click on any card below to populate the workspace:'
                : 'विभिन्न क्रेडिबिलिटी पतों से मेल खाने वाले परीक्षण मामलों का त्वरित परीक्षण करें:'}
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '12px'
            }}>
              {/* Verified True */}
              <div 
                onClick={() => {
                  setActiveTab('text');
                  setTextInput("NASA confirms James Webb space telescope discovers atmospheric water vapor on rocky exoplanet.");
                  showToast(language === 'en' ? 'Loaded: Verified True text claim.' : 'सत्यापित सही दावा लोड किया गया।', 'success');
                }}
                className="glass-card"
                style={{ 
                  padding: '12px 14px', 
                  border: '3px solid #000000',
                  borderLeft: '8px solid var(--color-success) !important', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-xs)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  boxShadow: '3px 3px 0px #000000 !important',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px #000000 !important';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '3px 3px 0px #000000 !important';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Text Claim</span>
                  <span style={{ color: 'var(--color-success)' }}>Verified True</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>James Webb Discovery</p>
              </div>

              {/* Verified False */}
              <div 
                onClick={() => {
                  setActiveTab('text');
                  setTextInput("Drinking lemon juice with baking soda in hot water completely cures and prevents all viral infections.");
                  showToast(language === 'en' ? 'Loaded: Verified False text claim.' : 'सत्यापित गलत दावा लोड किया गया।', 'success');
                }}
                className="glass-card"
                style={{ 
                  padding: '12px 14px', 
                  border: '3px solid #000000',
                  borderLeft: '8px solid var(--color-danger) !important', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-xs)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  boxShadow: '3px 3px 0px #000000 !important',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px #000000 !important';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '3px 3px 0px #000000 !important';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Text Claim</span>
                  <span style={{ color: 'var(--color-danger)' }}>Verified False</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Lemon Juice Cure Claim</p>
              </div>

              {/* Misleading */}
              <div 
                onClick={() => {
                  setActiveTab('text');
                  setTextInput("Apple iOS 18 completely destroys iPhone batteries; users report 50% battery drop in 10 minutes.");
                  showToast(language === 'en' ? 'Loaded: Misleading text claim.' : 'भ्रामक दावा लोड किया गया।', 'success');
                }}
                className="glass-card"
                style={{ 
                  padding: '12px 14px', 
                  border: '3px solid #000000',
                  borderLeft: '8px solid var(--color-warning) !important', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-xs)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  boxShadow: '3px 3px 0px #000000 !important',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px #000000 !important';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '3px 3px 0px #000000 !important';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Text Claim</span>
                  <span style={{ color: 'var(--color-warning)' }}>Misleading</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>OS Battery Drainage Rumor</p>
              </div>

              {/* Breaking News */}
              <div 
                onClick={() => {
                  setActiveTab('text');
                  setTextInput("Earthquake of magnitude 6.5 hits region; official rescue teams dispatched. Severe damages reported.");
                  showToast(language === 'en' ? 'Loaded: Breaking News text claim.' : 'ताजा समाचार लोड किया गया।', 'success');
                }}
                className="glass-card"
                style={{ 
                  padding: '12px 14px', 
                  border: '3px solid #000000',
                  borderLeft: '8px solid var(--color-info) !important', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-xs)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  boxShadow: '3px 3px 0px #000000 !important',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px #000000 !important';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '3px 3px 0px #000000 !important';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Text Claim</span>
                  <span style={{ color: 'var(--color-info)' }}>Breaking News</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Natural Disaster Report</p>
              </div>

              {/* YouTube Video URL */}
              <div 
                onClick={() => {
                  setActiveTab('url');
                  setUrlInput("https://youtube.com/shorts/eKz9iHbN_T8?si=v5iH6wSCMn5pji3K");
                  showToast(language === 'en' ? 'Loaded: YouTube video link.' : 'यूट्यूब वीडियो लिंक लोड किया गया।', 'success');
                }}
                className="glass-card"
                style={{ 
                  padding: '12px 14px', 
                  border: '3px solid #000000',
                  borderLeft: '8px solid #ff0000 !important', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-xs)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  boxShadow: '3px 3px 0px #000000 !important',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px #000000 !important';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '3px 3px 0px #000000 !important';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Video Link</span>
                  <span style={{ color: '#ff0000' }}>YouTube URL</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Healthy Snack Tutorial</p>
              </div>

              {/* Social Media Link */}
              <div 
                onClick={() => {
                  setActiveTab('url');
                  setUrlInput("https://x.com/isro/status/1694318712345678901");
                  showToast(language === 'en' ? 'Loaded: X social media post.' : 'एक्स सोशल मीडिया पोस्ट लोड किया गया।', 'success');
                }}
                className="glass-card"
                style={{ 
                  padding: '12px 14px', 
                  border: '3px solid #000000',
                  borderLeft: '8px solid #000000 !important', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-xs)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  boxShadow: '3px 3px 0px #000000 !important',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px #000000 !important';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '3px 3px 0px #000000 !important';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Social Media</span>
                  <span style={{ color: 'var(--text-primary)' }}>X (Twitter) URL</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>Official ISRO Moon Update</p>
              </div>

              {/* PDF Document */}
              <div 
                onClick={() => {
                  setActiveTab('pdf');
                  loadExample('credible', 'pdf');
                }}
                className="glass-card"
                style={{ 
                  padding: '12px 14px', 
                  border: '3px solid #000000',
                  borderLeft: '8px solid var(--color-primary) !important', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-xs)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  boxShadow: '3px 3px 0px #000000 !important',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px #000000 !important';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '3px 3px 0px #000000 !important';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>PDF Document</span>
                  <span style={{ color: 'var(--color-primary)' }}>PDF Attachment</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>NASA Science Review</p>
              </div>

              {/* Image Screenshot */}
              <div 
                onClick={() => {
                  setActiveTab('image');
                  loadExample('caution', 'image');
                }}
                className="glass-card"
                style={{ 
                  padding: '12px 14px', 
                  border: '3px solid #000000',
                  borderLeft: '8px solid var(--color-danger) !important', 
                  cursor: 'pointer', 
                  borderRadius: 'var(--radius-xs)', 
                  backgroundColor: 'var(--bg-tertiary)',
                  boxShadow: '3px 3px 0px #000000 !important',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '5px 5px 0px #000000 !important';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '3px 3px 0px #000000 !important';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  <span>Image Screenshot</span>
                  <span style={{ color: 'var(--color-danger)' }}>PNG Capture</span>
                </div>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase' }}>OS Software Rumor</p>
              </div>
            </div>
          </div>

          {/* Premium Segmented Control Tabs - Brutalist Multi-Segment Border Control */}
          <div style={{
            display: 'flex',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-xs)',
            border: '3px solid #000000',
            boxShadow: '4px 4px 0px #000000',
            overflow: 'hidden'
          }}>
            {tabs.map((tab, idx) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setUploadedFile(null); }}
                  style={{
                    backgroundColor: isActive ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    color: '#000000',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '0.9rem 1.1rem',
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    border: 'none',
                    borderRight: idx === tabs.length - 1 ? 'none' : '3px solid #000000',
                    transition: 'background-color var(--transition-fast)'
                  }}
                >
                  {tab.icon}
                  <span style={{ fontSize: '0.82rem' }}>{language === 'en' ? tab.labelEn : tab.labelHi}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Panel Context - Brutalist Container */}
          <div className="glass-card" style={{
            padding: 'var(--space-xl)',
            minHeight: '260px',
            backgroundColor: 'var(--bg-secondary)',
            border: '3px solid #000000',
            boxShadow: '6px 6px 0px #000000',
            borderRadius: 'var(--radius-md)'
          }}>
            
            {activeTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <textarea
                  className="input-field"
                  placeholder={language === 'en' ? 'Paste the news article or post body here...' : 'समाचार लेख या पोस्ट का मुख्य भाग यहाँ पेस्ट करें...'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  maxLength={10000}
                  style={{ minHeight: '180px', resize: 'vertical', border: '3px solid #000000', borderRadius: 'var(--radius-xs)' }}
                  aria-label="Raw Text Submission Input"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  <span>{language === 'en' ? 'Supports English & Hindi' : 'अंग्रेजी और हिंदी का समर्थन करता है'}</span>
                  <span>{textInput.length} / 10000 {language === 'en' ? 'chars' : 'अक्षर'}</span>
                </div>
              </div>
            )}

            {activeTab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-primary)', letterSpacing: '0.02em' }}>
                  {language === 'en' ? 'Article URL / Link' : 'लेख यूआरएल / लिंक'}
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/news-story"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  style={{ border: '3px solid #000000', borderRadius: 'var(--radius-xs)' }}
                  aria-label="Website Link Submission Input"
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  {language === 'en' ? 'E.g., news portals, research pages, blog posts, YouTube/Reels video links.' : 'उदा. समाचार पोर्टल, शोध पृष्ठ, ब्लॉग पोस्ट, यूट्यूब/रील्स वीडियो लिंक।'}
                </span>
              </div>
            )}

            {activeTab === 'image' && (
              <UploadZone
                acceptType="image/*"
                file={uploadedFile}
                onFileSelected={setUploadedFile}
              />
            )}

            {activeTab === 'pdf' && (
              <UploadZone
                acceptType="application/pdf"
                file={uploadedFile}
                onFileSelected={setUploadedFile}
              />
            )}

          </div>

          {/* Action Trigger - Massive Brutalist Launch Button */}
          <button
            onClick={() => handleStartAnalysis()}
            className="btn btn-primary btn-large"
            style={{
              width: '100%',
              marginTop: 'var(--space-md)',
              padding: '1.25rem',
              fontSize: '1.1rem',
              backgroundColor: 'var(--color-primary)',
              color: '#000000',
              border: '3px solid #000000',
              boxShadow: '6px 6px 0px #000000',
              transition: 'transform var(--transition-fast), box-shadow var(--transition-fast)'
            }}
          >
            <Play size={20} fill="currentColor" />
            <span style={{ fontWeight: 900, letterSpacing: '0.06em' }}>
              {language === 'en' ? 'LAUNCH FORENSIC AUDIT' : 'फॉरेंसिक ऑडिट शुरू करें'}
            </span>
          </button>
        </div>
      )}

      {/* Entity Clarification Modal Dialog */}
      {clarificationData && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div className="glass-card animate-scale-up" style={{
            maxWidth: '500px',
            width: '100%',
            padding: 'var(--space-xl)',
            border: '1px solid var(--border-color)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)'
          }}>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <HelpCircle size={22} color="var(--color-primary)" />
              <span>{language === 'en' ? 'Clarification Required' : 'स्पष्टीकरण आवश्यक है'}</span>
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {language === 'en' 
                ? `Multiple entities match the name "${clarificationData.subject}". Please select the correct entity to proceed:` 
                : `नाम "${clarificationData.subject}" के लिए कई विकल्प मिले। कृपया सही विकल्प चुनें:`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {clarificationData.candidates.map((cand, idx) => (
                <label key={idx} className="glass-card" style={{
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  border: selectedCandidate === cand ? '1px solid var(--color-primary)' : '1px solid var(--border-color)',
                  backgroundColor: selectedCandidate === cand ? 'rgba(0, 102, 255, 0.05)' : 'transparent',
                  transition: 'all 0.2s ease'
                }}>
                  <input
                    type="radio"
                    name="clarificationCandidate"
                    value={cand}
                    checked={selectedCandidate === cand}
                    onChange={() => setSelectedCandidate(cand)}
                    style={{ accentColor: 'var(--color-primary)', width: '16px', height: '16px' }}
                  />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>{cand}</span>
                </label>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button
                className="btn btn-secondary"
                style={{ flex: 1 }}
                onClick={() => setClarificationData(null)}
              >
                {language === 'en' ? 'Cancel' : 'रद्द करें'}
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleConfirmClarification}
              >
                {language === 'en' ? 'Confirm & Verify' : 'पुष्टि करें और सत्यापित करें'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
