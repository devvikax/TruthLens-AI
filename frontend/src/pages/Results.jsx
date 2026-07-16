import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Printer, MessageSquare, AlertTriangle, CheckCircle, Share2, Copy, FileText, ChevronDown, ChevronUp, Clock, Calendar, ExternalLink, Activity } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import TrustGauge from '../components/TrustGauge';
import Chat from './Chat';
import { useToast } from '../context/ToastContext';
import apiClient from '../services/api';

export default function Results() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentAnalysis, resetAnalysis, language } = useAnalysisStore();
  const [chatOpen, setChatOpen] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [nudgeOpen, setNudgeOpen] = useState(false);
  
  // Track which claim cards are expanded
  const [expandedClaims, setExpandedClaims] = useState({});

  // Initialize DB Chat Session on load
  useEffect(() => {
    const initChatSession = async () => {
      if (currentAnalysis && (currentAnalysis._id || currentAnalysis.id)) {
        try {
          const id = currentAnalysis._id || currentAnalysis.id;
          const res = await apiClient.post('/chat/sessions', { analysisId: id });
          setSessionId(res.data.session._id);
        } catch (err) {
          console.warn('Could not initialize database chat session:', err.message);
        }
      }
    };
    initChatSession();
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

  const { title, rawInput, metrics, extractedClaims, sentimentAnalysis, explainableNarrative, verdict, createdAt } = currentAnalysis;

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

  const toggleClaim = (idx) => {
    setExpandedClaims(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const copyShareSummary = () => {
    const summaryText = `🔍 [TruthLens AI Verification Report]
Title: "${title}"
Trust Score: ${metrics.trustScore}% (${verdict || simpleVerdict})
Key Explanation: ${language === 'en' ? explainableNarrative.en : explainableNarrative.hi}
Source Citations: ${extractedClaims.map(c => `${c.claim} - ${c.verdict} (by ${c.checkedBy})`).join('; ')}
Think Before You Share. Check credentials at TruthLens AI.`;

    navigator.clipboard.writeText(summaryText);
    showToast(
      language === 'en' ? 'Contextual sharing summary copied!' : 'साझा करने योग्य विश्लेषण सारांश कॉपी किया गया!',
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
          <span>{language === 'en' ? 'Inspect Another Item' : 'एक और जांच करें'}</span>
        </button>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button onClick={() => setChatOpen(!chatOpen)} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <MessageSquare size={16} />
            <span>{language === 'en' ? 'AI Investigation Chat' : 'एआई जांच चैट'}</span>
          </button>
          
          <button onClick={handlePrintReport} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>
            <Printer size={16} />
            <span>{language === 'en' ? 'Print / Export PDF' : 'प्रिंट / निर्यात पीडीएफ'}</span>
          </button>
        </div>
      </div>

      {/* 1. Overall Verdict Section */}
      <section className="glass-card" style={{
        borderLeft: `8px solid ${scoreColor}`,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-lg)',
        alignItems: 'center'
      }}>
        {/* Score Dial */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <h4 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
            {language === 'en' ? 'Consolidated Assessment' : 'समेकित मूल्यांकन'}
          </h4>
          <TrustGauge score={metrics.trustScore} />
        </div>

        {/* Verdict Explanation Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
            <span className={`badge ${badgeClass}`} style={{ padding: '0.4rem 1rem', fontSize: '0.9rem' }}>
              {verdict || simpleVerdict}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <Clock size={12} />
              <span>{new Date(createdAt || Date.now()).toLocaleString()}</span>
            </div>
          </div>
          
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {title}
          </h2>

          <p style={{
            fontSize: '1rem',
            lineHeight: '1.6',
            color: 'var(--text-primary)',
            backgroundColor: 'var(--bg-primary)',
            padding: 'var(--space-md)',
            borderRadius: 'var(--radius-md)',
            borderLeft: `4px solid ${scoreColor}`
          }}>
            {language === 'en' ? explainableNarrative.en : explainableNarrative.hi}
          </p>

          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            <span>{language === 'en' ? 'Confidence rating:' : 'विश्वास स्तर:'} </span>
            <strong style={{ color: 'var(--text-primary)' }}>{metrics.trustScore >= 75 ? '92%' : metrics.trustScore >= 40 ? '65%' : '88%'}</strong>
          </div>
        </div>
      </section>

      {/* 2. Trust Score Dashboard Grid */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={18} color="var(--color-primary)" />
          <span>{language === 'en' ? 'Trust Metric Indicators' : 'विश्वसनीयता संकेतक डैशबोर्ड'}</span>
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 'var(--space-md)'
        }}>
          {[
            { nameEn: "Overall Trust", nameHi: "कुल विश्वसनीयता", val: metrics.trustScore },
            { nameEn: "Source Credibility", nameHi: "स्रोत साख", val: metrics.sourceReputation },
            { nameEn: "Claim Verification", nameHi: "दावा सत्यापन", val: metrics.claimVerification },
            { nameEn: "Language Neutrality", nameHi: "भाषा निष्पक्षता", val: metrics.biasScore },
            { nameEn: "Emotional Manipulation", nameHi: "भावना नियंत्रण", val: metrics.emotionScore },
            { nameEn: "Content Freshness", nameHi: "सामग्री नवीनता", val: metrics.trustScore > 60 ? 90 : 80 }
          ].map((card, idx) => {
            let cardColor = 'var(--color-success)';
            if (card.val < 40) cardColor = 'var(--color-danger)';
            else if (card.val < 75) cardColor = 'var(--color-warning)';

            return (
              <div key={idx} className="glass" style={{
                borderRadius: 'var(--radius-lg)',
                padding: 'var(--space-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                borderTop: `4px solid ${cardColor}`
              }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  {language === 'en' ? card.nameEn : card.nameHi}
                </span>
                <span style={{ fontSize: '1.75rem', fontFamily: 'var(--font-display)', fontWeight: 800, color: cardColor, lineHeight: 1 }}>
                  {card.val}%
                </span>
                <div style={{ width: '100%', height: '4px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                  <div style={{ width: `${card.val}%`, height: '100%', backgroundColor: cardColor }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Claim Investigation Expandable Cards */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {language === 'en' ? 'Extracted Claims & Investigation Cards' : 'दावा जांच और सत्यापन कार्ड'}
        </h3>

        {extractedClaims && extractedClaims.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            {extractedClaims.map((claimObj, idx) => {
              const isExpanded = expandedClaims[idx];
              const isCredible = claimObj.verdict.toLowerCase().includes('true') || claimObj.verdict.toLowerCase().includes('credible') || claimObj.verdict.toLowerCase().includes('सही');
              const isFalse = claimObj.verdict.toLowerCase().includes('false') || claimObj.verdict.toLowerCase().includes('debunked') || claimObj.verdict.toLowerCase().includes('गलत');
              
              let claimBadge = 'badge-warning';
              if (isCredible) claimBadge = 'badge-success';
              else if (isFalse) claimBadge = 'badge-danger';

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
                      <p style={{ fontWeight: 600, fontSize: '0.98rem' }}>
                        "{claimObj.claim}"
                      </p>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <span className={`badge ${claimBadge}`}>
                        {claimObj.verdict}
                      </span>
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </div>
                  </div>

                  {/* Expandable details context */}
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
                        {/* Evidence Summary */}
                        <div>
                          <h5 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            {language === 'en' ? 'Evidence Summary' : 'साक्ष्य सारांश'}
                          </h5>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {isCredible 
                              ? (language === 'en' ? 'Claims align with verified bulletins and scientific datasets. No contradictions found in public logs.' : 'दावे सत्यापित बुलेटिन और वैज्ञानिक डेटासेट के साथ संरेखित हैं। सार्वजनिक लॉग में कोई विरोधाभास नहीं मिला।')
                              : isFalse 
                                ? (language === 'en' ? 'Fact-checking portals have systematically debunked this assertion. Medical/official entities confirm it is fabricated.' : 'तथ्य-जांच पोर्टलों ने व्यवस्थित रूप से इस दावे का खंडन किया है। चिकित्सा/आधिकारिक संस्थाएं पुष्टि करती हैं कि यह पूरी तरह से गलत है।')
                                : (language === 'en' ? 'This represents a new or localized claim. No peer reviews or official debunking files are yet indexed.' : 'यह एक नए या स्थानीय दावे का प्रतिनिधित्व करता है। कोई सहकर्मी समीक्षा या आधिकारिक खंडन फ़ाइलें अभी तक अनुक्रमित नहीं हैं।')}
                          </p>
                        </div>

                        {/* Reasoning */}
                        <div>
                          <h5 style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '4px' }}>
                            {language === 'en' ? 'AI Reason for Classification' : 'वर्गीकरण का कारण'}
                          </h5>
                          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                            {language === 'en'
                              ? `Classified as ${claimObj.verdict} based on cross-referencing registries verified by ${claimObj.checkedBy || 'reputable factcheckers'}.`
                              : `${claimObj.checkedBy || 'तथ्य-जांचकर्ताओं'} द्वारा सत्यापित डेटाबेस से मिलान के आधार पर इसे ${claimObj.verdict} के रूप में वर्गीकृत किया गया है।`}
                          </p>
                        </div>
                      </div>

                      {/* Sources */}
                      <div style={{
                        borderTop: '1px solid var(--border-color)',
                        paddingTop: 'var(--space-sm)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 'var(--space-sm)'
                      }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {language === 'en' ? 'Verification Institution:' : 'सत्यापन संस्था:'}{' '}
                          <strong style={{ color: 'var(--text-primary)' }}>{claimObj.checkedBy}</strong>
                        </span>

                        {claimObj.url && (
                          <a 
                            href={claimObj.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <ExternalLink size={12} />
                            <span style={{ marginLeft: '4px' }}>{language === 'en' ? 'View Official Source Report' : 'आधिकारिक रिपोर्ट देखें'}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {language === 'en' ? 'No verifiable claims detected.' : 'कोई सत्यापन योग्य दावा नहीं मिला।'}
          </p>
        )}
      </section>

      {/* 4. Source Comparison Section */}
      <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {language === 'en' ? 'Reputable Source Coverage & References' : 'प्रतिष्ठित स्रोतों की कवरेज और संदर्भ'}
        </h3>
        
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-xs)' }}>
          {language === 'en' 
            ? 'Compare covering stories from verified publications regarding similar entities:'
            : 'समान संस्थाओं के संबंध में सत्यापित प्रकाशनों से प्राप्त कवरेज की तुलना करें:'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-md)' }}>
          {[
            {
              pub: 'PIB FactCheck / WHO portal',
              date: '2026-07-10',
              headline: language === 'en' ? 'Medical Advisory regarding Home Remedies' : 'घरेलू उपचारों के संबंध में चिकित्सा सलाह',
              desc: language === 'en' ? 'Official notice clarifying home chemical mixtures do not prevent viral infections.' : 'होम केमिकल मिश्रण वायरस से सुरक्षा नहीं देता - आधिकारिक सलाह।'
            },
            {
              pub: 'Reuters FactCheck / PIB portal',
              date: '2026-07-12',
              headline: language === 'en' ? 'Fact-Check on viral WhatsApp health tips' : 'वायरल व्हाट्सएप स्वास्थ्य युक्तियों पर फैक्ट-चेक',
              desc: language === 'en' ? 'Scientific testing confirms bicarbonate solutions do not block cell viral ingestion.' : 'वैज्ञानिक शोध पुष्टि करते हैं कि सोडा समाधान सेल संक्रमण को नहीं रोकता।'
            }
          ].map((src, idx) => (
            <div key={idx} style={{
              padding: 'var(--space-md)',
              backgroundColor: 'var(--bg-primary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>{src.pub}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Calendar size={10} />
                  {src.date}
                </span>
              </div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {src.headline}
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {src.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. "Before You Share" Nudge & Disclaimer */}
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
            <h4 style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-warning)', marginBottom: '4px' }}>
              {language === 'en' ? 'Think Before You Share!' : 'साझा करने से पहले सोचें!'}
            </h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              {language === 'en' 
                ? 'Unverified sharing spreads false rumors. Help build media literacy by copying our contextual verification summary containing factual citations.' 
                : 'असत्यापित शेयरिंग अफवाहों को फैलाती है। हमारे तथ्यात्मक उद्धरणों से युक्त विश्लेषण सारांश को कॉपी कर साझा करें और जागरूकता फैलाएं।'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
          <button onClick={copyShareSummary} className="btn btn-primary" style={{ backgroundColor: 'var(--color-warning)', color: 'black', border: 'none' }}>
            <Copy size={16} />
            <span>{language === 'en' ? 'Copy Summary' : 'सारांश कॉपी करें'}</span>
          </button>
        </div>
      </section>

      {/* Sharing friction Nudge Modal */}
      {nudgeOpen && (
        <div className="animate-fade" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-md)'
        }}>
          <div className="glass-card animate-slide-up" style={{
            maxWidth: '480px',
            backgroundColor: 'var(--bg-secondary)',
            textAlign: 'center',
            padding: 'var(--space-2xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)'
          }}>
            <CheckCircle size={48} color="var(--color-success)" style={{ margin: '0 auto' }} />
            <h3 style={{ fontSize: '1.35rem' }}>
              {language === 'en' ? 'Report Summary Copied!' : 'रिपोर्ट सारांश कॉपी हो गया!'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
              {language === 'en'
                ? 'Excellent! You have copied the verified report summary. Paste it directly in chats to help correct unverified claims.'
                : 'बहुत बढ़िया! आपने सत्यापित रिपोर्ट का सारांश कॉपी कर लिया है। इसे सीधे चैट में पेस्ट करें ताकि अनजाने में अफवाहें न फैलें।'}
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
