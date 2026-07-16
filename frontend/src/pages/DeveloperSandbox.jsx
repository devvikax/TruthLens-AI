import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, Terminal, Cpu, Code, Compass, Play, AlertCircle, 
  CheckCircle, XCircle, RefreshCw, Layers, Database, ShieldAlert 
} from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import apiClient from '../services/api';
import { useToast } from '../context/ToastContext';

export default function DeveloperSandbox() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { currentAnalysis, language } = useAnalysisStore();

  const [activeTab, setActiveTab] = useState('overview');
  const [testClaim, setTestClaim] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Load history list from server to allow selecting past analyses
  const fetchRecentAnalyses = async () => {
    setLoadingHistory(true);
    try {
      const res = await apiClient.get('/analysis/history');
      setHistoryList(res.data.history || []);
    } catch (err) {
      console.warn('Failed to retrieve history:', err.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRecentAnalyses();
  }, []);

  const handleSelectAnalysis = (analysisObj) => {
    useAnalysisStore.setState({ currentAnalysis: analysisObj });
    showToast(language === 'en' ? 'Loaded telemetry for selected analysis!' : 'चयनित विश्लेषण के लिए टेलीमेट्री लोड की गई!', 'success');
  };

  const handleRunVerification = async (e) => {
    e.preventDefault();
    if (!testClaim.trim()) {
      showToast(language === 'en' ? 'Please enter a test claim.' : 'कृपया परीक्षण दावा दर्ज करें।', 'danger');
      return;
    }

    setLoading(true);
    try {
      showToast(language === 'en' ? 'Running dynamic verification pipeline...' : 'गतिशील सत्यापन पाइपलाइन चला रहा है...', 'info');
      
      const res = await apiClient.post('/analysis/quick', { 
        text: testClaim 
      });

      if (res.data && res.data.analysis) {
        useAnalysisStore.setState({ currentAnalysis: res.data.analysis });
        showToast(language === 'en' ? 'Verification complete! Dossier generated.' : 'सत्यापन पूरा हुआ! डोजियर उत्पन्न हुआ।', 'success');
        fetchRecentAnalyses();
      }
    } catch (err) {
      if (err.response && err.response.status === 409) {
        // Trigger verification modal flow by going to analyze route with preset state
        showToast(language === 'en' ? 'Ambiguity detected! Redirecting to clarification modal.' : 'अस्पष्टता का पता चला! स्पष्टीकरण मोड पर पुनर्निर्देशित कर रहा है।', 'warning');
        navigate('/analyze');
      } else {
        showToast(err.response?.data?.message || err.message, 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  // Safe checks for metadata fields
  const metadata = currentAnalysis?.metadata || {};
  const debugLogs = metadata.debugLogs || {};
  const traces = debugLogs.traces || [];
  const rejectedSources = debugLogs.rejectedSources || [];
  const queries = debugLogs.generatedQueries || {};
  const claimMetadata = debugLogs.claimMetadata || {};
  const resolvedEntity = debugLogs.resolvedEntity || {};

  return (
    <div className="container animate-fade" style={{ padding: 'var(--space-2xl) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-xl)' }}>
      {/* Top Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button onClick={() => navigate('/results')} className="btn btn-secondary" style={{ padding: '8px 12px' }}>
          <ArrowLeft size={16} />
          <span>{language === 'en' ? 'Back to Results' : 'परिणाम पर वापस जाएं'}</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
          <Terminal size={20} color="var(--color-primary)" />
          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--color-primary)' }}>
            FORENSIC TELEMETRY CONSOLE v2.0
          </span>
        </div>
      </div>

      {/* Main Title Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.02) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-xl)'
      }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-xs)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Cpu size={32} color="var(--color-primary)" />
          {language === 'en' ? 'Developer Sandbox & Telemetry Hub' : 'डेवलपर सैंडबॉक्स और टेलीमेट्री हब'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
          {language === 'en' 
            ? 'Inspect raw LLM prompts, query intelligence logs, discarded/rejected sources, entity link confidences, and dynamic verification routing.'
            : 'कच्चे एलएलएम संकेत, क्वेरी इंटेलिजेंस लॉग, अस्वीकृत स्रोत, इकाई लिंक विश्वास और गतिशील सत्यापन रूटिंग का निरीक्षण करें।'}
        </p>
      </div>

      {/* Verification Query Tester Form */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <h3 style={{ fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Play size={16} color="var(--color-primary)" />
          <span>{language === 'en' ? 'Live Claim Tester Sandbox' : 'लाइव दावा परीक्षक सैंडबॉक्स'}</span>
        </h3>
        <form onSubmit={handleRunVerification} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder={language === 'en' ? "Enter claim statement to test (e.g. 'Amitabh Bachchan died')" : "परीक्षण करने के लिए दावा दर्ज करें (जैसे 'अमिताभ बच्चन का निधन')"}
            value={testClaim}
            onChange={(e) => setTestClaim(e.target.value)}
            disabled={loading}
            style={{ flex: 1, minWidth: '280px', fontFamily: 'monospace' }}
          />
          <button type="submit" disabled={loading} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>{language === 'en' ? 'Executing Pipeline...' : 'पाइपलाइन चल रही है...'}</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>{language === 'en' ? 'Run Telemetry Sweep' : 'टेलीमेट्री स्वीप चलाएं'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Main Sandbox Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 'var(--space-lg)', alignItems: 'start' }}>
        
        {/* Left Column: Recent Audits List */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)', maxHeight: '600px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '1rem', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={16} color="var(--color-info)" />
            <span>{language === 'en' ? 'Select Analysis Logs' : 'विश्लेषण लॉग चुनें'}</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {loadingHistory ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Loading recent audits...</p>
            ) : historyList.length > 0 ? (
              historyList.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSelectAnalysis(item)}
                  style={{
                    textAlign: 'left',
                    padding: '10px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    backgroundColor: currentAnalysis && (currentAnalysis._id === item._id || currentAnalysis.id === item.id) ? 'rgba(59, 130, 246, 0.08)' : 'var(--bg-secondary)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    fontSize: '0.82rem',
                    transition: 'all 0.2s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <strong style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', width: '280px' }}>
                    {item.title}
                  </strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Category: {item.metadata?.claimCategory || 'Unclassified'} | Score: {item.trustScore}%
                  </span>
                </button>
              ))
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No past audits found in DB.</p>
            )}
          </div>
        </div>

        {/* Right Column: Telemetry details */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          {/* Debug Tabs Header */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'entity', name: 'Entity & Queries' },
              { id: 'validated', name: 'Sources Crawled' },
              { id: 'rejected', name: `Rejected Sources (${rejectedSources.length})` },
              { id: 'traces', name: `LLM Prompts & JSON (${traces.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.88rem',
                  fontWeight: activeTab === tab.id ? 700 : 500,
                  color: activeTab === tab.id ? 'var(--color-primary)' : 'var(--text-muted)',
                  borderBottom: activeTab === tab.id ? '2px solid var(--color-primary)' : 'none',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Tab Contents: Overview */}
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Raw Original Input</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.88rem', wordBreak: 'break-all' }}>
                    {currentAnalysis?.rawInput || 'No input loaded.'}
                  </p>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Normalized Claim Text</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-primary)' }}>
                    {claimMetadata.normalizedClaim || 'No normalized claim compiled.'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Verdict Decided</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 700, fontSize: '1rem', color: 'var(--color-warning)' }}>
                    {debugLogs.finalVerdict || currentAnalysis?.explainableNarrative?.en ? 'Resolved' : 'No verdict resolved.'}
                  </p>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Active Strategy Selector</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.88rem' }}>
                    {metadata.verificationStrategy || 'Not determined.'}
                  </p>
                </div>

                <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                  <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Pipeline route</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 600, fontSize: '0.88rem', color: 'var(--color-success)' }}>
                    {metadata.pipelineSelected || 'Dynamic RAV Engine v2'}
                  </p>
                </div>
              </div>

              {/* RAG audit payload preview */}
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                  Forensic Confidence dna Breakdown
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                  {currentAnalysis?.confidenceDetails?.components ? (
                    Object.entries(currentAnalysis.confidenceDetails.components).map(([key, val]) => (
                      <div key={key} style={{ padding: '6px 12px', backgroundColor: 'var(--bg-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <span style={{ textTransform: 'capitalize', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{key}: </span>
                        <strong style={{ fontSize: '0.82rem', color: 'var(--color-primary)' }}>{val}%</strong>
                      </div>
                    ))
                  ) : (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>No confidence breakdown logged.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Contents: Entity & Queries */}
          {activeTab === 'entity' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              {/* Entity Linking Parameters */}
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--color-primary)' }}>Entity Linker Metadata</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Canonical Entity:</span>{' '}
                    <strong>{resolvedEntity.resolvedEntity || 'None detected'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Entity Type:</span>{' '}
                    <strong>{resolvedEntity.entityType || 'None'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Linker Confidence:</span>{' '}
                    <strong>{resolvedEntity.confidence ? `${(resolvedEntity.confidence * 100).toFixed(0)}%` : '0%'}</strong>
                  </div>
                </div>
              </div>

              {/* Generated Queries List */}
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--color-primary)' }}>Dynamic Bidirectional Queries Generated</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(queries).map(([key, val]) => (
                    <div key={key} style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', fontSize: '0.82rem' }}>
                      <span style={{ width: '150px', textTransform: 'capitalize', color: 'var(--text-muted)', fontWeight: 600 }}>{key}:</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>"{val}"</span>
                    </div>
                  ))}
                  {Object.keys(queries).length === 0 && (
                    <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>No queries generated.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab Contents: Validated Crawled Sources */}
          {activeTab === 'validated' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {currentAnalysis?.evidenceCollected && currentAnalysis.evidenceCollected.length > 0 ? (
                currentAnalysis.evidenceCollected.map((src, idx) => (
                  <div key={idx} style={{
                    padding: '12px', 
                    backgroundColor: 'var(--bg-secondary)', 
                    borderRadius: 'var(--radius-md)',
                    borderLeft: `4px solid ${src.stance === 'supports' ? 'var(--color-success)' : src.stance === 'contradicts' ? 'var(--color-danger)' : 'var(--text-muted)'}`
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.88rem' }}>{src.title}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Rank Index: #{idx + 1}</span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{src.snippet}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', marginTop: '6px', color: 'var(--text-muted)' }}>
                      <span>Source: <strong style={{ color: 'var(--text-primary)' }}>{src.source}</strong></span>
                      <span>Relevance: <strong style={{ color: 'var(--color-primary)' }}>{src.relevanceScore}/100</strong></span>
                      <span>Trust Rating: <strong style={{ color: 'var(--color-success)' }}>{src.reliabilityScore || 50}/100</strong></span>
                      <span>Stance: <span style={{ color: src.stance === 'supports' ? 'var(--color-success)' : src.stance === 'contradicts' ? 'var(--color-danger)' : 'var(--text-muted)' }}>{src.stance?.toUpperCase()}</span></span>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No validated sources retained.</p>
              )}
            </div>
          )}

          {/* Tab Contents: Rejected Sources */}
          {activeTab === 'rejected' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-danger)' }}>
                <ShieldAlert size={16} />
                <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rejected weakly matching sources to prevent false positives (Threshold &lt; 50/100)</span>
              </div>
              
              {rejectedSources.length > 0 ? (
                rejectedSources.map((src, idx) => (
                  <div key={idx} style={{
                    padding: '12px', 
                    backgroundColor: 'rgba(239, 68, 68, 0.01)', 
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(239, 68, 68, 0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '4px' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>{src.title}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-danger)', fontWeight: 600 }}>Score: {src.score}/100</span>
                    </div>
                    <p style={{ margin: '4px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{src.snippet}</p>
                    <p style={{ margin: '6px 0 0 0', fontSize: '0.78rem', color: 'var(--color-danger)' }}>
                      <strong>Mismatch Logic:</strong> {src.reason}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No sources were discarded during validation.</p>
              )}
            </div>
          )}

          {/* Tab Contents: LLM Traces */}
          {activeTab === 'traces' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {traces.length > 0 ? (
                traces.map((trace, idx) => (
                  <div key={idx} style={{
                    padding: '12px',
                    backgroundColor: 'var(--bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', borderBottom: '1px solid var(--border-color)', paddingBottom: '6px', marginBottom: '10px' }}>
                      <strong style={{ fontSize: '0.88rem', color: 'var(--color-primary)' }}>Task: {trace.taskName}</strong>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Provider: {trace.provider} | Latency: {trace.latencyMs}ms</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Prompt Sent to LLM</span>
                        <pre style={{
                          margin: '4px 0 0 0',
                          padding: '8px',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '120px'
                        }}>
                          {trace.prompt}
                        </pre>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block' }}>Returned Response / JSON</span>
                        <pre style={{
                          margin: '4px 0 0 0',
                          padding: '8px',
                          backgroundColor: 'var(--bg-primary)',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.75rem',
                          fontFamily: 'monospace',
                          overflowX: 'auto',
                          whiteSpace: 'pre-wrap',
                          maxHeight: '160px',
                          color: trace.status === 'success' ? '#10b981' : '#ef4444'
                        }}>
                          {trace.response}
                        </pre>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No LLM executions trace found (Cache hit or fallbacks used).</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
