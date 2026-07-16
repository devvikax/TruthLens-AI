import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlignLeft, Link2, Image as ImageIcon, FileText, Play, CheckCircle2, Circle } from 'lucide-react';
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

  const handleStartAnalysis = async () => {
    // Validation
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

    const inputData = activeTab === 'text' ? textInput : activeTab === 'url' ? urlInput : '';
    const res = await analyzeContent(activeTab, inputData, uploadedFile);
    
    if (res.success) {
      navigate('/results');
    } else {
      showToast(res.message, 'danger');
    }
  };

  return (
    <div className="container" style={{ padding: 'var(--space-2xl) 0', maxWidth: '800px' }}>
      
      {isAnalyzing ? (
        /* Processing Animation Screen */
        <div className="glass-card pulse-glow animate-fade" style={{
          textAlign: 'center',
          padding: 'var(--space-2xl)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-xl)'
        }}>
          <div className="loader" style={{ width: '48px', height: '48px', borderWidth: '5px' }}></div>
          
          <div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--space-xs)' }}>
              {language === 'en' ? 'Analyzing Content...' : 'सामग्री का विश्लेषण किया जा रहा है...'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {language === 'en' ? 'Processing inputs through multi-layered claim registries and semantic checks.' : 'मल्टी-लेयर्ड क्लेम रजिस्ट्रियों और सिमेंटिक जांचों के माध्यम से इनपुट को संसाधित किया जा रहा है।'}
            </p>
          </div>

          {/* Stepper Display */}
          <div style={{
            width: '100%',
            maxWidth: '450px',
            textAlign: 'left',
            backgroundColor: 'var(--bg-primary)',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-md)'
          }}>
            {processingSteps.map((step) => (
              <div 
                key={step.id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-sm)',
                  opacity: step.status === 'idle' ? 0.4 : 1,
                  transition: 'opacity var(--transition-fast)'
                }}
              >
                {step.status === 'completed' ? (
                  <CheckCircle2 size={18} color="var(--color-success)" />
                ) : step.status === 'running' ? (
                  <div className="loader" style={{ width: '16px', height: '16px', borderWidth: '2px' }}></div>
                ) : (
                  <Circle size={18} color="var(--text-muted)" />
                )}
                <span style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: step.status === 'running' ? 600 : 400,
                  color: step.status === 'completed' ? 'var(--text-primary)' : step.status === 'running' ? 'var(--color-primary)' : 'var(--text-secondary)'
                }}>
                  {step.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Submission Forms Page */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)' }}>
              {language === 'en' ? 'Start Content Inspection' : 'सामग्री निरीक्षण शुरू करें'}
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>
              {language === 'en' ? 'Submit raw text, web addresses, or document captures to check credentials.' : 'क्रेडेंशियल्स की जांच करने के लिए टेक्स्ट, वेब पते या दस्तावेज़ कैप्चर सबमिट करें।'}
            </p>
          </div>

          {/* Judge Demo Desk Callout Card */}
          <div className="glass-card" style={{
            border: '1.5px solid var(--color-primary)',
            backgroundColor: 'rgba(99, 102, 241, 0.04)',
            padding: 'var(--space-md) var(--space-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Play size={18} color="var(--color-primary)" />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                {language === 'en' ? 'Judge Demo Desk (Hackathon Sandbox)' : 'न्यायाधीश डेमो डेस्क (हैकाथॉन सैंडबॉक्स)'}
              </strong>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {language === 'en'
                ? 'Quick-test our pipeline using pre-loaded multi-modal mock attachments matching distinct credibility profiles:'
                : 'विभिन्न क्रेडिबिलिटी प्रोफाइल से मेल खाने वाले प्री-लोडेड परीक्षण मामलों का त्वरित परीक्षण करें:'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
              <button 
                onClick={() => {
                  setActiveTab('pdf');
                  loadExample('credible', 'pdf');
                }} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderLeft: '4px solid var(--color-success)', flex: 1, minWidth: '180px' }}
              >
                🟢 {language === 'en' ? 'NASA Discovery (PDF Document)' : 'नासा रिपोर्ट (पीडीएफ)'}
              </button>
              <button 
                onClick={() => {
                  setActiveTab('image');
                  loadExample('caution', 'image');
                }} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderLeft: '4px solid var(--color-warning)', flex: 1, minWidth: '180px' }}
              >
                🟡 {language === 'en' ? 'OS Battery Rumor (Screenshot Image)' : 'बैटरी अफवाह (स्क्रीनशॉट)'}
              </button>
              <button 
                onClick={() => {
                  setActiveTab('text');
                  loadExample('misleading', 'text');
                }} 
                className="btn btn-secondary" 
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', borderLeft: '4px solid var(--color-danger)', flex: 1, minWidth: '180px' }}
              >
                🔴 {language === 'en' ? 'Lemon Soda Cure (WhatsApp Text Forward)' : 'नींबू उपचार (टेक्स्ट)'}
              </button>
            </div>
          </div>

          {/* Tab Headers */}
          <div style={{
            display: 'flex',
            borderBottom: '2px solid var(--border-color)',
            gap: 'var(--space-xs)',
            overflowX: 'auto',
            paddingBottom: '2px'
          }}>
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setUploadedFile(null); }}
                  className="btn"
                  style={{
                    backgroundColor: isActive ? 'var(--bg-tertiary)' : 'transparent',
                    color: isActive ? 'var(--color-primary)' : 'var(--text-secondary)',
                    borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                    borderBottom: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
                    padding: '0.75rem 1rem',
                    flex: '1 0 auto'
                  }}
                >
                  {tab.icon}
                  <span>{language === 'en' ? tab.labelEn : tab.labelHi}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Panel Context */}
          <div className="glass-card" style={{ padding: 'var(--space-xl)', minHeight: '260px' }}>
            
            {activeTab === 'text' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <textarea
                  className="input-field"
                  placeholder={language === 'en' ? 'Paste the news article or post body here...' : 'समाचार लेख या पोस्ट का मुख्य भाग यहाँ पेस्ट करें...'}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  maxLength={10000}
                  style={{ minHeight: '180px', resize: 'vertical' }}
                  aria-label="Raw Text Submission Input"
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>{language === 'en' ? 'Supports English & Hindi' : 'अंग्रेजी और हिंदी का समर्थन करता है'}</span>
                  <span>{textInput.length} / 10000 {language === 'en' ? 'chars' : 'अक्षर'}</span>
                </div>
              </div>
            )}

            {activeTab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  {language === 'en' ? 'Article URL / Link' : 'लेख यूआरएल / लिंक'}
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://example.com/news-story"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  aria-label="Website Link Submission Input"
                />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {language === 'en' ? 'E.g., news portals, research pages, blog posts.' : 'उदा. समाचार पोर्टल, शोध पृष्ठ, ब्लॉग पोस्ट।'}
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

          {/* Action Trigger */}
          <button
            onClick={handleStartAnalysis}
            className="btn btn-primary btn-large"
            style={{ width: '100%', marginTop: 'var(--space-md)' }}
          >
            <Play size={18} fill="currentColor" />
            <span>
              {language === 'en' ? 'Verify with TruthLens AI' : 'ट्रुथलेंस एआई के साथ सत्यापित करें'}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
