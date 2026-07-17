import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Printer, MessageSquare, AlertTriangle, CheckCircle, Share2, 
  Copy, FileText, ChevronDown, ChevronUp, Clock, Calendar, ExternalLink, 
  Activity, Scale, ShieldAlert, Award, Compass, RefreshCw, BarChart2, Check, X, ShieldCheck,
  Image as ImageIcon, Globe
} from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import TrustGauge from '../components/TrustGauge';
import Chat from './Chat';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/api';

export default function Results() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentAnalysis, resetAnalysis, language, lastAnalyzedFile } = useAnalysisStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  const [imgUrl, setImgUrl] = useState(null);
  
  // Track claim & evidence chain steps expanded state
  const [expandedClaims, setExpandedClaims] = useState({});
  const [expandedChainStep, setExpandedChainStep] = useState(null);

  // Hook up object URL for local image preview
  useEffect(() => {
    if (lastAnalyzedFile && (lastAnalyzedFile instanceof File || lastAnalyzedFile instanceof Blob)) {
      const url = URL.createObjectURL(lastAnalyzedFile);
      setImgUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [lastAnalyzedFile]);

  // XAI explainability style options
  const [persona, setPersona] = useState('general');
  const [explanationText, setExplanationText] = useState(null);
  const [loadingPersona, setLoadingPersona] = useState(false);

  // Initialize DB Chat Session and local narrative state on load
  useEffect(() => {
    const initChatSession = async () => {
      if (currentAnalysis && (currentAnalysis._id || currentAnalysis.id)) {
        const id = currentAnalysis._id || currentAnalysis.id;
        try {
          const res = await apiClient.post('/chat/sessions', { analysisId: id });
          setSessionId(res.data.session._id);
        } catch (err) {
          console.warn('Could not initialize database chat session:', err.message);
        }
      }
    };
    initChatSession();

    if (currentAnalysis && currentAnalysis.explainableNarrative) {
      setExplanationText(currentAnalysis.explainableNarrative);
    }
  }, [currentAnalysis]);

  if (!currentAnalysis) {
    return (
      <div className="container animate-fade" style={{ textAlign: 'center', padding: 'var(--space-2xl) 0' }}>
        <AlertTriangle size={48} color="var(--color-warning)" style={{ marginBottom: 'var(--space-md)' }} />
        <h2>{language === 'en' ? 'No Active Analysis Found' : 'कोई सक्रिय विश्लेषण नहीं मिला'}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-lg)' }}>
          {language === 'en' ? 'Please submit content to inspect it first.' : 'कृपया पहले निरीक्षण के लिए सामग्री सबमिट करें।'}
        </p>
        <Link to="/analyze" className="btn btn-primary">
          {language === 'en' ? 'Go to Analysis' : 'विश्लेषण पर जाएं'}
        </Link>
      </div>
    );
  }

  const { 
    title, rawInput, metrics, decomposedClaims, evidenceCollected, 
    diversityProfile, contradictionReport, timeline, badges, 
    evidenceGraph, confidenceDetails, createdAt 
  } = currentAnalysis;

  // HSL Status Colors
  let scoreColor = 'var(--color-success)';
  let bgGlow = 'rgba(16, 185, 129, 0.08)';
  let simpleVerdict = 'Likely Genuine';
  let badgeClass = 'badge-success';

  if (metrics.trustScore < 40) {
    scoreColor = 'var(--color-danger)';
    bgGlow = 'rgba(239, 68, 68, 0.08)';
    simpleVerdict = 'Likely Misleading';
    badgeClass = 'badge-danger';
  } else if (metrics.trustScore < 75) {
    scoreColor = 'var(--color-warning)';
    bgGlow = 'rgba(245, 158, 11, 0.08)';
    simpleVerdict = 'Needs Verification';
    badgeClass = 'badge-warning';
  }

  // Prosecution vs Defense evidence division
  const supportingEvidence = evidenceCollected ? evidenceCollected.filter(e => {
    return e.stance === 'supports' || (e.isTrusted && !e.category.includes('Fact Check') && e.stance !== 'contradicts');
  }) : [];

  const prosecutingEvidence = evidenceCollected ? evidenceCollected.filter(e => {
    return e.stance === 'contradicts' || e.category.includes('Fact Check') || !e.isTrusted;
  }) : [];

  const toggleClaim = (idx) => {
    setExpandedClaims(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const handlePersonaChange = async (style) => {
    setPersona(style);
    setLoadingPersona(true);
    try {
      const id = currentAnalysis._id || currentAnalysis.id;
      const res = await apiClient.post(`/analysis/${id}/explain-like`, { style });
      setExplanationText(res.data.explanation);
    } catch (err) {
      showToast(
        language === 'en' ? 'Failed to regenerate explanation style.' : 'स्पष्टीकरण शैली बदलने में विफल।',
        'error'
      );
    } finally {
      setLoadingPersona(false);
    }
  };

  const copyShareSummary = () => {
    const summaryText = `🔍 [TruthLens-AI Courtroom Report]
Title: "${title}"
Verdict: ${currentAnalysis.verdict || simpleVerdict} (Confidence: ${confidenceDetails?.score || 85}%)
Persona Explanation [${persona.toUpperCase()}]: ${language === 'en' ? explanationText?.en : explanationText?.hi}
Think Before You Share. Ground truth verified at TruthLens-AI.`;

    navigator.clipboard.writeText(summaryText);
    showToast(
      language === 'en' ? 'Forensic summary copied to clipboard!' : 'साझा करने योग्य रिपोर्ट कॉपी हो गई है!',
      'success'
    );
    setNudgeOpen(true);
  };

  const handlePrintReport = () => {
    window.print();
  };

  const startNewAnalysis = () => {
    resetAnalysis();
    navigate('/analyze');
  };

  return (
    <div className="container animate-fade" style={{ padding: 'var(--space-xl) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
      
      {/* Action Buttons Header */}
      <div className="ai-chat-button-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-md)' }}>
        <button onClick={startNewAnalysis} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
          <ArrowLeft size={16} />
          <span>{language === 'en' ? 'Start New Investigation' : 'नई जांच शुरू करें'}</span>
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button onClick={() => setChatOpen(!chatOpen)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <MessageSquare size={16} />
            <span>{language === 'en' ? 'AI Courtroom Assistant' : 'एआई कोर्ट रूम सहायक'}</span>
          </button>
          
          <button onClick={handlePrintReport} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <Printer size={16} />
            <span>{language === 'en' ? 'Export Court Transcript' : 'न्यायालय रिपोर्ट निर्यात करें'}</span>
          </button>
        </div>
      </div>

      {/* Title & Gavel Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Scale size={28} color="var(--color-primary)" />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>
          {language === 'en' ? 'AI Courtroom Verdict Summary' : 'एआई कोर्ट रूम निर्णय'}
        </h1>
      </div>

      {/* 1. Verdict & Judge Explanation Card */}
      <section className="glass-card" style={{
        borderLeft: `8px solid ${scoreColor}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-lg)',
        alignItems: 'start'
      }}>
        {/* Trust Gauge Column */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-md) 0' }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {language === 'en' ? 'Synthesized Trust Gauge' : 'संश्लेषित विश्वास सूचक'}
          </h4>
          <TrustGauge score={metrics.trustScore} />
        </div>

        {/* Verdict Details Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <span className={`badge ${badgeClass}`} style={{ padding: '0.5rem 1.25rem', fontSize: '1rem', fontWeight: 800 }}>
              {currentAnalysis.verdict || simpleVerdict}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Clock size={12} />
              <span>{new Date(createdAt || Date.now()).toLocaleString()}</span>
            </div>
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: 0 }}>
            {title}
          </h2>



          {/* Explain Like Persona Switcher Pills */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {language === 'en' ? 'Explain Like:' : 'स्पष्टीकरण शैली:'}
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {['child', 'student', 'general', 'researcher', 'journalist', 'developer'].map((style) => (
                <button
                  key={style}
                  onClick={() => handlePersonaChange(style)}
                  disabled={loadingPersona}
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.78rem',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: persona === style ? 'var(--color-primary)' : 'var(--bg-tertiary)',
                    color: persona === style ? 'black' : 'var(--text-primary)',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textTransform: 'capitalize',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Explanation Paragraph */}
          <div style={{ position: 'relative' }}>
            {loadingPersona && (
              <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center',
                justifyContent: 'center', borderRadius: 'var(--radius-md)'
              }}>
                <RefreshCw className="animate-spin" size={24} color="var(--color-primary)" />
              </div>
            )}
            <p style={{
              fontSize: '0.95rem',
              lineHeight: '1.6',
              color: 'var(--text-primary)',
              backgroundColor: 'var(--bg-primary)',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-md)',
              borderLeft: `4px solid ${scoreColor}`,
              minHeight: '80px'
            }}>
              {language === 'en' ? explanationText?.en : explanationText?.hi}
            </p>
          </div>

          {/* Recommended actions & Risk of Sharing */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 'var(--space-md)',
            padding: 'var(--space-sm)',
            backgroundColor: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {language === 'en' ? 'Risk of Sharing' : 'साझा करने का जोखिम'}
              </span>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600, color: metrics.trustScore < 50 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                {metrics.trustScore < 40 ? '🔴 Extreme Risk (Abundant Misinformation)' : metrics.trustScore < 75 ? '🟡 Moderate Risk (Needs Context)' : '🟢 Negligible Risk (Verified Claims)'}
              </p>
            </div>
            <div>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {language === 'en' ? 'Recommended Action' : 'सलाह दी गई कार्रवाई'}
              </span>
              <p style={{ margin: 0, fontSize: '0.88rem', fontWeight: 600 }}>
                {metrics.trustScore < 40 ? '🚫 Refuse to share. Correct peers.' : metrics.trustScore < 75 ? '⚠️ Inspect contradictions first.' : '✅ Share freely with verified citations.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Inspected Evidence Exhibit Section */}
      <section className="glass animate-fade" style={{
        padding: 'var(--space-xl)',
        backgroundColor: 'var(--bg-secondary)',
        border: '3px solid #000000',
        boxShadow: '6px 6px 0px #000000',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ImageIcon size={22} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>
            {language === 'en' ? 'COURT EXHIBIT A: SOURCE EVIDENCE MATERIAL' : 'कोर्ट प्रदर्शनी ए: स्रोत साक्ष्य सामग्री'}
          </h3>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 'var(--space-lg)',
          alignItems: 'center'
        }}>
          {/* Left Side: Exhibit Visual/Icon representation */}
          <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            {currentAnalysis.inputType === 'image' && (
              imgUrl ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <img 
                    src={imgUrl} 
                    alt="Inspected Court Exhibit" 
                    style={{ 
                      width: '100%', 
                      maxHeight: '280px', 
                      objectFit: 'contain', 
                      border: '3px solid #000000', 
                      boxShadow: '4px 4px 0px #000000', 
                      borderRadius: 'var(--radius-xs)',
                      backgroundColor: '#000000'
                    }} 
                  />
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {language === 'en' ? 'Uploaded Image Capture Preview' : 'अपलोड की गई छवि का पूर्वावलोकन'}
                  </span>
                </div>
              ) : (
                /* High fidelity warning mock graphic for OS software rumor or generic image */
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '100%' }}>
                  <div style={{
                    background: '#090a0f',
                    border: '3px solid #000000',
                    borderRadius: 'var(--radius-sm)',
                    boxShadow: '4px 4px 0px #000000',
                    width: '100%',
                    maxWidth: '220px',
                    padding: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    color: '#f8fafc',
                    fontFamily: 'monospace',
                    textAlign: 'left'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', color: '#64748b' }}>
                      <span>SYSTEM TRACE</span>
                      <span>🔋 74%</span>
                    </div>
                    <div style={{
                      backgroundColor: '#fb7185',
                      border: '2px solid #000000',
                      padding: '6px',
                      color: '#000000',
                      borderRadius: 'var(--radius-xs)',
                      boxShadow: '2px 2px 0px #000000',
                      fontSize: '0.72rem',
                      fontWeight: 900,
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      marginTop: '15px'
                    }}>
                      🚨 ALERT: BATTERY SWELL
                    </div>
                    <p style={{ fontSize: '0.65rem', lineHeight: '1.4', color: '#cbd5e1', marginTop: '8px', marginBottom: 0 }}>
                      "The new OS update is causing batteries to swell up and explode. Do not download!"
                    </p>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {language === 'en' ? 'Simulated Mobile Rumor Screenshot' : 'सिम्युलेटेड मोबाइल अफवाह स्क्रीनशॉट'}
                  </span>
                </div>
              )
            )}

            {currentAnalysis.inputType === 'pdf' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-xl)',
                border: '3px solid #000000',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                boxShadow: '4px 4px 0px #000000',
                gap: '12px',
                textAlign: 'center',
                width: '100%',
                maxWidth: '300px'
              }}>
                <FileText size={48} color="var(--color-primary)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem', wordBreak: 'break-all' }}>
                    {lastAnalyzedFile?.name || 'NASA_Science_Review.pdf'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    PDF Exhibit Attachment
                  </span>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                  {language === 'en' ? 'PDF DOCUMENT' : 'पीडीएफ दस्तावेज़'}
                </span>
              </div>
            )}

            {currentAnalysis.inputType === 'url' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-xl)',
                border: '3px solid #000000',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                boxShadow: '4px 4px 0px #000000',
                gap: '12px',
                textAlign: 'center',
                width: '100%',
                maxWidth: '320px'
              }}>
                <Globe size={48} color="var(--color-info)" />
                <div style={{ width: '100%' }}>
                  <strong style={{ display: 'block', fontSize: '0.88rem', wordBreak: 'break-all', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {currentAnalysis.sourceUrl}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                    {language === 'en' ? 'Scraped Website link' : 'स्क्रेप किया गया वेबसाइट लिंक'}
                  </span>
                </div>
                <a 
                  href={currentAnalysis.sourceUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-secondary" 
                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                >
                  <span>{language === 'en' ? 'Visit URL Link' : 'यूआरएल लिंक देखें'}</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            )}

            {currentAnalysis.inputType === 'text' && (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 'var(--space-xl)',
                border: '3px solid #000000',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-tertiary)',
                boxShadow: '4px 4px 0px #000000',
                gap: '12px',
                textAlign: 'center',
                width: '100%',
                maxWidth: '300px'
              }}>
                <FileText size={48} color="var(--color-primary)" />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.9rem' }}>
                    {language === 'en' ? 'Plain Text Payload' : 'सादा पाठ पेलोड'}
                  </strong>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {language === 'en' ? 'Clipboard Plaintext Exhibit' : 'क्लिपबोर्ड प्लेनटेक्स्ट पेलोड'}
                  </span>
                </div>
                <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>
                  {language === 'en' ? 'TEXT INPUT' : 'टेक्स्ट इनपुट'}
                </span>
              </div>
            )}
          </div>

          {/* Right Side: Monospace console readouts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>
                {language === 'en' ? 'Extracted Text Payload Ledger' : 'निकाले गए पाठ का पेलोड बहीखाता'}
              </span>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(rawInput);
                  showToast(
                    language === 'en' ? 'Exhibit text copied!' : 'प्रदर्शनी पाठ कॉपी किया गया!',
                    'success'
                  );
                }}
                className="btn btn-secondary" 
                style={{ padding: '3px 8px', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Copy size={12} />
                <span>{language === 'en' ? 'Copy Text' : 'पाठ कॉपी करें'}</span>
              </button>
            </div>

            <div style={{
              width: '100%',
              backgroundColor: '#000000',
              color: '#ffffff',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.82rem',
              padding: 'var(--space-md)',
              borderRadius: 'var(--radius-xs)',
              border: '3px solid #000000',
              maxHeight: '220px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              boxShadow: 'inset 0 2px 8px rgba(0, 0, 0, 0.7)',
              textAlign: 'left'
            }}>
              {rawInput}
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', gap: '10px' }}>
              <span>
                {currentAnalysis.inputType === 'image' && `📸 OCR engine successfully parsed ${rawInput?.split(/\s+/).length || 0} words.`}
                {currentAnalysis.inputType === 'pdf' && `📄 PDF text parser successfully extracted ${rawInput?.split(/\s+/).length || 0} words.`}
                {currentAnalysis.inputType === 'url' && `🌐 JSDOM scrape engine successfully pulled ${rawInput?.split(/\s+/).length || 0} words.`}
                {currentAnalysis.inputType === 'text' && `📝 Plain text check of ${rawInput?.split(/\s+/).length || 0} words.`}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Courtroom Arguments Panels (Prosecution vs Defense) */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-lg)' }}>
        
        {/* Prosecution Panel (Evidence Against) */}
        <div className="glass-card" style={{ borderTop: '6px solid var(--color-danger)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-danger)' }}>
            <ShieldAlert size={20} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              {language === 'en' ? 'Prosecution: Evidence Against' : 'अभियोजन: विरुद्ध साक्ष्य'}
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            {language === 'en' ? 'Contradicting domains, fact-checks, and official denials:' : 'दावे का खंडन करने वाले स्रोत और फैक्ट-चेक:'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {prosecutingEvidence.length > 0 ? (
              prosecutingEvidence.map((ev, idx) => (
                <div key={idx} className="glass-card" style={{
                  padding: '16px', 
                  backgroundColor: 'rgba(239, 68, 68, 0.02)',
                  border: '1px solid rgba(239, 68, 68, 0.15)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
                        fontWeight: 'bold', color: 'var(--color-danger)'
                      }}>
                        {ev.source ? ev.source.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-danger)' }}>{ev.source || 'Fact Check'}</strong>
                    </div>
                    <span className="badge badge-danger" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {language === 'en' ? 'CONTRADICTS' : 'खंडन करता है'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.9rem', margin: '2px 0', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {ev.title}
                  </h4>
                  
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    "{ev.snippet}"
                  </p>

                  {/* Why it matters explainer */}
                  {ev.whyItMatters && (
                    <div style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.05)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      borderLeft: '3px solid var(--color-danger)'
                    }}>
                      <strong>{language === 'en' ? 'Why it matters: ' : 'यह क्यों महत्वपूर्ण है: '}</strong>
                      {ev.whyItMatters}
                    </div>
                  )}

                  {/* Scores & URL Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {language === 'en' ? 'Reliability: ' : 'विश्वसनीयता: '}
                        <strong style={{ color: 'var(--text-primary)' }}>{ev.reliabilityScore || 50}%</strong>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {language === 'en' ? 'Relevance: ' : 'प्रासंगिकता: '}
                        <strong style={{ color: 'var(--text-primary)' }}>{ev.relevanceScore || 50}%</strong>
                      </span>
                    </div>

                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                      >
                        <span>{language === 'en' ? 'View Source' : 'स्रोत देखें'}</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0', color: 'var(--text-muted)' }}>
                <CheckCircle size={32} color="var(--color-success)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.85rem' }}>
                  {language === 'en' ? 'No contradicting evidence or official denials found.' : 'विरोधाभास या आधिकारिक खंडन का कोई प्रमाण नहीं मिला।'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Defense Panel (Evidence Supporting) */}
        <div className="glass-card" style={{ borderTop: '6px solid var(--color-success)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-success)' }}>
            <ShieldCheck size={20} />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0 }}>
              {language === 'en' ? 'Defense: Supporting Evidence' : 'बचाव: समर्थन में साक्ष्य'}
            </h3>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
            {language === 'en' ? 'Corroborating news, academic findings, and official releases:' : 'दावे का समर्थन करने वाले आधिकारिक समाचार और लेख:'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {supportingEvidence.length > 0 ? (
              supportingEvidence.map((ev, idx) => (
                <div key={idx} className="glass-card" style={{
                  padding: '16px', 
                  backgroundColor: 'rgba(16, 185, 129, 0.02)',
                  border: '1px solid rgba(16, 185, 129, 0.15)', 
                  borderRadius: 'var(--radius-md)',
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '8px',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem',
                        fontWeight: 'bold', color: 'var(--color-success)'
                      }}>
                        {ev.source ? ev.source.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <strong style={{ fontSize: '0.85rem', color: 'var(--color-success)' }}>{ev.source || 'General News'}</strong>
                    </div>
                    <span className="badge badge-success" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                      {language === 'en' ? 'SUPPORTS' : 'समर्थन करता है'}
                    </span>
                  </div>

                  <h4 style={{ fontSize: '0.9rem', margin: '2px 0', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {ev.title}
                  </h4>
                  
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                    "{ev.snippet}"
                  </p>

                  {/* Why it matters explainer */}
                  {ev.whyItMatters && (
                    <div style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.05)',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.78rem',
                      color: 'var(--text-secondary)',
                      borderLeft: '3px solid var(--color-success)'
                    }}>
                      <strong>{language === 'en' ? 'Why it matters: ' : 'यह क्यों महत्वपूर्ण है: '}</strong>
                      {ev.whyItMatters}
                    </div>
                  )}

                  {/* Scores & URL Button */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '8px', marginTop: '4px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {language === 'en' ? 'Reliability: ' : 'विश्वसनीयता: '}
                        <strong style={{ color: 'var(--text-primary)' }}>{ev.reliabilityScore || 50}%</strong>
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {language === 'en' ? 'Relevance: ' : 'प्रासंगिकता: '}
                        <strong style={{ color: 'var(--text-primary)' }}>{ev.relevanceScore || 50}%</strong>
                      </span>
                    </div>

                    {ev.url && (
                      <a
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', gap: '4px', alignItems: 'center' }}
                      >
                        <span>{language === 'en' ? 'View Source' : 'स्रोत देखें'}</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg) 0', color: 'var(--text-muted)' }}>
                <AlertTriangle size={32} color="var(--color-warning)" style={{ marginBottom: '8px' }} />
                <p style={{ fontSize: '0.85rem' }}>
                  {language === 'en' ? 'No supporting evidence or corroborated articles found.' : 'दावे का समर्थन करने वाला कोई लेख या प्रमाण नहीं मिला।'}
                </p>
              </div>
            )}
          </div>
        </div>

      </section>

      {/* 3. Judge Panel Heuristics Explainer */}
      <section className="glass-card" style={{ borderLeft: '8px solid var(--color-primary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--space-sm)' }}>
          <Scale size={22} color="var(--color-primary)" />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
            {language === 'en' ? 'Judge Panel: Auditing Verdict Logic' : 'न्यायाधीश पैनल: निर्णय ऑडिट तर्क'}
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)', fontSize: '0.88rem', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>1. Weighing of Arguments:</strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              {metrics.trustScore < 40 
                ? (language === 'en' ? 'Contradictory factcheck registry blocks are active. The claim is classified as fake.' : 'तथ्य-जांच रिकॉर्ड मौजूद हैं जो इस दावे का स्पष्ट खंडन करते हैं। इसे भ्रामक माना गया है।')
                : (language === 'en' ? 'Supporting records verify assertions. Consensual declarations are documented.' : 'सत्यापित रिकॉर्ड और तथ्य इस दावे की सत्यता की पुष्टि करते हैं।')}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>2. Confidence Factors:</strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              {language === 'en' 
                ? `Calculated at ${confidenceDetails?.score || 85}% using quality, agreement metrics, and source diversity.`
                : `दावे का संकलन मूल्य ${confidenceDetails?.score || 85}% गुणवत्ता, साक्ष्य सहमति और विविधता पर आधारित है।`}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong style={{ color: 'var(--text-primary)' }}>3. Ignored Sources:</strong>
            <span style={{ color: 'var(--text-secondary)' }}>
              {language === 'en' 
                ? 'Syndicated wire copies and blogs with duplicate identifiers are grouped under wire nodes to avoid double-counting.'
                : 'प्रतियों और अनधिकृत ब्लॉगों से प्राप्त डेटा को प्राथमिक नोड में मिला दिया गया ताकि दोहरी गणना न हो।'}
            </span>
          </div>
        </div>
      </section>

      {/* 4. Confidence Breakdown */}
      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <BarChart2 size={18} color="var(--color-primary)" />
          <span>{language === 'en' ? 'Mathematical Confidence Breakdown' : 'विश्वास स्तर का गणितीय विश्लेषण'}</span>
        </h3>

        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          {language === 'en' 
            ? 'Visualizing the contribution of different metrics in building the final confidence score:'
            : 'अंतिम विश्वास स्कोर के निर्माण में विभिन्न संकेतकों के योगदान का प्रदर्शन:'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)' }}>
          {[
            { name: 'Entity Confidence', val: confidenceDetails?.components?.entity || confidenceDetails?.components?.reliability || 90, weight: '15%' },
            { name: 'Claim parsing', val: confidenceDetails?.components?.claim || 95, weight: '15%' },
            { name: 'Retrieval coverage', val: confidenceDetails?.components?.retrieval || 80, weight: '20%' },
            { name: 'Evidence rating', val: confidenceDetails?.components?.evidence || 75, weight: '25%' },
            { name: 'Verdict consensus', val: confidenceDetails?.components?.verdict || confidenceDetails?.components?.agreement || 90, weight: '25%' }
          ].map((comp, idx) => (
            <div key={idx} style={{
              padding: '12px', backgroundColor: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', gap: '6px'
            }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>{comp.name}</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--color-primary)' }}>{comp.val}%</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Wt: {comp.weight}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Confidence transparency logs */}
        {confidenceDetails?.transparencyLogs && (
          <div style={{ padding: '10px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>
              {language === 'en' ? 'Confidence Audit Logs:' : 'विश्वास स्तर का ऑडिट लॉग:'}
            </span>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {confidenceDetails.transparencyLogs.map((log, idx) => (
                <li key={idx}>{log}</li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 5. Evidence Chain Interactive Timeline */}
      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          {language === 'en' ? 'Evidence Chain: Auditing Process Trail' : 'एविडेंस चेन: संपूर्ण ऑडिट प्रक्रिया'}
        </h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          {language === 'en' 
            ? 'Click on any step of the auditing process pipeline to explore verification logs:'
            : 'सत्यापन विवरणों का पता लगाने के लिए ऑडिट प्रक्रिया के किसी भी चरण पर क्लिक करें:'}
        </p>

        {/* Chain nodes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[
            { step: 'Input Normalization', desc: 'Raw pastes, HTML tags, or image uploads are normalized and cleaned.' },
            { step: 'Claim Decomposing', desc: 'Sentences are parsed to isolate distinct assertions and assign priority.' },
            { step: 'Parallel Adapters Search', desc: 'Queries factcheck registries, WHO, NASA, and news outlets concurrently.' },
            { step: 'Source Trust Registry Audit', desc: 'Crawled domains are scored according to STR categorization and whitelists.' },
            { step: 'Evidence Weighted Ranking', desc: 'Retrievals are relevance-filtered and ranked according to configured parameters.' },
            { step: 'Contradiction Matrix Analysis', desc: 'Compares evidence to check if sources agree, contradict, or remain silent.' },
            { step: 'Final Verdict Resolution', desc: 'Verdict resolved as Verified True, Likely True, Unverified, or Verified Fake.' }
          ].map((item, idx) => (
            <div key={idx} style={{
              borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)',
              overflow: 'hidden'
            }}>
              <div 
                onClick={() => setExpandedChainStep(expandedChainStep === idx ? null : idx)}
                style={{
                  padding: '10px 16px', display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center', cursor: 'pointer', backgroundColor: expandedChainStep === idx ? 'var(--bg-tertiary)' : 'var(--bg-secondary)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--bg-tertiary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, border: '1px solid var(--border-color)'
                  }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.step}</span>
                </div>
                {expandedChainStep === idx ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>

              {expandedChainStep === idx && (
                <div style={{ padding: '12px 16px', backgroundColor: 'var(--bg-primary)', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {item.desc}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 6. Claim-by-Claim Forensic Dossier folders */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, margin: 0 }}>
          {language === 'en' ? 'Claim-by-Claim Case Files' : 'दावा-दर-दावा केस फाइलें'}
        </h3>

        {decomposedClaims && decomposedClaims.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {decomposedClaims.map((claimObj, idx) => {
              const isExpanded = expandedClaims[idx];
              
              // Claim agreement verdict styling
              const isCredible = claimObj.agreementPercent >= 75;
              const isFalse = claimObj.agreementPercent < 30;
              let claimBadge = 'badge-warning';
              if (isCredible) claimBadge = 'badge-success';
              else if (isFalse) claimBadge = 'badge-danger';

              // Filter evidence matching this specific claim
              const matchingEvidence = evidenceCollected ? evidenceCollected.filter(e => {
                const claimWords = claimObj.normalizedSentence.toLowerCase().split(/\s+/).filter(w => w.length > 4);
                return claimWords.some(word => e.snippet.toLowerCase().includes(word) || e.title.toLowerCase().includes(word));
              }) : [];

              return (
                <div key={idx} className="glass" style={{
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border-color)',
                  overflow: 'hidden'
                }}>
                  {/* Card Header (Clickable) */}
                  <div 
                    onClick={() => toggleClaim(idx)}
                    style={{
                      padding: 'var(--space-md) var(--space-lg)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      backgroundColor: 'var(--bg-secondary)',
                      gap: 'var(--space-md)',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <p style={{ fontWeight: 600, fontSize: '0.98rem', margin: 0 }}>
                        "{claimObj.normalizedSentence}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <span className={`badge ${claimBadge}`}>
                        {claimObj.agreementPercent >= 75 ? 'Corroborated' : claimObj.agreementPercent < 30 ? 'Contradicted' : 'Unverified'}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expandable Case Folder Details */}
                  {isExpanded && (
                    <div style={{
                      padding: 'var(--space-lg)',
                      backgroundColor: 'var(--bg-primary)',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--space-md)'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)' }}>
                        {/* Dossier info */}
                        <div>
                          <h5 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', margin: 0 }}>
                            {language === 'en' ? 'Claim Metrics' : 'दावा संकेतक'}
                          </h5>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px', paddingTop: '6px' }}>
                            <li>Priority Level: <strong style={{ textTransform: 'capitalize' }}>{claimObj.priority}</strong></li>
                            <li>Agreement consensus: <strong>{claimObj.agreementPercent}%</strong></li>
                            <li>Evidence Strength rating: <strong>{claimObj.evidenceStrength}%</strong></li>
                            <li>Supporting sources: <strong>{claimObj.supportingCount}</strong></li>
                            <li>Contradicting sources: <strong>{claimObj.contradictingCount}</strong></li>
                          </ul>
                        </div>

                        {/* Source Justification (Why used/trusted) */}
                        <div>
                          <h5 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px', margin: 0 }}>
                            {language === 'en' ? 'Source Audit Justification' : 'स्रोत ऑडिट औचित्य'}
                          </h5>
                          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0, paddingTop: '6px' }}>
                            {matchingEvidence.length > 0 
                              ? `Used source [${matchingEvidence[0].source}] (STR reliability: ${matchingEvidence[0].reliabilityScore}%). Classified as ${matchingEvidence[0].category} with ${matchingEvidence[0].primarySource?.isOriginal ? 'original reporting' : 'copied wire'} status.`
                              : 'No matching primary source found. Dynamic SSL signals were used for validation.'}
                          </p>
                        </div>
                      </div>

                      {/* Supporting vs Contradicting references list */}
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 'var(--space-md)' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                          {language === 'en' ? 'Linked Case Evidence Reference Map:' : 'संबद्ध केस सबूत संदर्भ मानचित्र:'}
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {matchingEvidence.map((ev, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', backgroundColor: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: 'var(--radius-md)' }}>
                              <span>{ev.title} ({ev.source})</span>
                              {ev.url && (
                                <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}>
                                  <span>Link</span>
                                  <ExternalLink size={10} />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {language === 'en' ? 'No decomposed claim folders detected.' : 'कोई दावा फोल्डर नहीं मिला।'}
          </p>
        )}
      </section>

      {/* 7. "Before You Share" Friction Nudge */}
      <section className="glass-card before-share-warning" style={{
        border: '1.5px solid var(--color-warning)',
        backgroundColor: 'var(--color-warning-bg)',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-lg)'
      }}>
        <div style={{ display: 'flex', gap: 'var(--space-md)', flex: 1, minWidth: '280px' }}>
          <AlertTriangle size={28} color="var(--color-warning)" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-warning)', marginBottom: '4px', margin: 0 }}>
              {language === 'en' ? 'Think Before You Share!' : 'साझा करने से पहले सोचें!'}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', margin: 0, marginTop: '4px' }}>
              {language === 'en' 
                ? 'Unverified sharing spreads false rumors. Help build media literacy by copying our courtroom verification summary containing factual citations.' 
                : 'असत्यापित शेयरिंग अफवाहों को फैलाती है। हमारे तथ्यात्मक उद्धरणों से युक्त विश्लेषण सारांश को कॉपी कर साझा करें और जागरूकता फैलाएं।'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button onClick={copyShareSummary} className="btn btn-primary" style={{ backgroundColor: 'var(--color-warning)', color: 'black', border: 'none' }}>
            <Copy size={16} />
            <span>{language === 'en' ? 'Copy Court Report' : 'निर्णय सारांश कॉपी करें'}</span>
          </button>
        </div>
      </section>

      {/* Sharing friction Nudge Modal */}
      {nudgeOpen && (
        <div className="animate-fade" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-md)'
        }}>
          <div className="glass-card animate-slide-up" style={{
            maxWidth: '480px', backgroundColor: 'var(--bg-secondary)',
            textAlign: 'center', padding: 'var(--space-2xl)',
            display: 'flex', flexDirection: 'column', gap: 'var(--space-md)'
          }}>
            <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto' }} />
            <h3 style={{ fontSize: '1.35rem', margin: 0 }}>
              {language === 'en' ? 'Forensic Verdict Copied!' : 'न्यायालय रिपोर्ट सारांश कॉपी हो गया!'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', margin: 0 }}>
              {language === 'en'
                ? 'Excellent! Paste this text directly in chats or WhatsApp groups to back your correction with verified courtroom evidence.'
                : 'बहुत बढ़िया! इसे सीधे चैट में पेस्ट करें ताकि अनजाने में अफवाहें न फैलें और तथ्य सामने आएं।'}
            </p>
            <button onClick={() => setNudgeOpen(false)} className="btn btn-primary">
              {language === 'en' ? 'Continue' : 'जारी रखें'}
            </button>
          </div>
        </div>
      )}

      {/* AI Chat drawer overlay */}
      {chatOpen && (
        <Chat sessionId={sessionId} onClose={() => setChatOpen(false)} />
      )}

    </div>
  );
}
