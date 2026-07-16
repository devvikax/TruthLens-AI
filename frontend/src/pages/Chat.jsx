import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, User, Sparkles, MessageSquare } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';
import apiClient from '../services/api';

export default function Chat({ sessionId, onClose }) {
  const { currentAnalysis, language } = useAnalysisStore();
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: language === 'en' 
        ? "Hello! I am your Media Literacy Assistant. How can I help you understand this analysis?"
        : "नमस्ते! मैं आपका मीडिया साक्षरता सहायक हूँ। इस विश्लेषण को समझने में मैं आपकी क्या मदद कर सकता हूँ?"
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loadingResponse, setLoadingResponse] = useState(false);
  const chatEndRef = useRef(null);

  // Sync with active DB messages if sessionId is available
  useEffect(() => {
    const fetchSessionMessages = async () => {
      if (sessionId) {
        try {
          const res = await apiClient.get(`/chat/sessions/${sessionId}`);
          // If custom endpoint is created, populate messages; otherwise initialize from current DB log
          if (res.data && res.data.messages) {
            setMessages(res.data.messages);
          }
        } catch (err) {
          // Silent fallback to standard template welcome
        }
      }
    };
    fetchSessionMessages();
  }, [sessionId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadingResponse]);

  const suggestions = [
    { labelEn: "Explain like I'm 10", labelHi: "आसान भाषा में समझाएं", prompt: "Explain this analysis simply like I am 10 years old." },
    { labelEn: "WhatsApp reply template", labelHi: "व्हाट्सएप जवाब ड्राफ्ट करें", prompt: "Draft a polite reply I can send on WhatsApp to correct this." },
    { labelEn: "Summarize key claims", labelHi: "दावों का सारांश", prompt: "Summarize the key verified and uncertain claims in 3 points." }
  ];

  const handleSend = async (textToSend) => {
    if (!textToSend.trim() || loadingResponse) return;

    // Append user input locally first
    const userMsg = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoadingResponse(true);

    try {
      if (sessionId) {
        // Send to real backend API session message endpoint
        const res = await apiClient.post(`/chat/sessions/${sessionId}/messages`, { text: textToSend });
        setMessages(res.data.messages);
      } else {
        // Fallback Mock delay
        await new Promise((res) => setTimeout(res, 1000));
        
        let botText = '';
        const query = textToSend.toLowerCase();
        const trust = currentAnalysis?.metrics?.trustScore || 50;

        if (query.includes('10') || query.includes('simply') || query.includes('सरल')) {
          botText = language === 'en'
            ? `Imagine a friend told you that lemon cures everything. VeriLens checked and found that doctors say this is not true! The message uses scary alarms like "MUST SHARE" to trick you. It has a low trust score of ${trust}%.`
            : `सोचिए किसी ने आपसे कहा कि नींबू से सब ठीक हो जाता है। डॉक्टरों का कहना है कि यह झूठ है! यह पोस्ट भ्रामक है और इसका ट्रस्ट स्कोर ${trust}% है।`;
        } else if (query.includes('whatsapp') || query.includes('reply') || query.includes('जवाब')) {
          botText = language === 'en'
            ? `Copy this message to reply: "Hi! I verified this info on VeriLens AI, and it flags it as ${trust > 40 ? 'caution advised' : 'misleading'} because fact-checks debunk the cures. Here is the link to read more: https://verilens.ai/results"`
            : `आप इसे कॉपी कर सकते हैं: "नमस्ते! मैंने इस जानकारी को वेरीलेंस एआई पर चेक किया। इसका स्कोर ${trust}% है क्योंकि डॉक्टरों ने इसे असत्य बताया है।"`;
        } else {
          botText = language === 'en'
            ? "Here is the key breakdown:\n1. The claim is unverified by official health groups.\n2. Sensational vocabulary is used to cause worry.\n3. Verify official advisories before sharing."
            : "मुख्य विश्लेषण:\n1. यह दावा स्वास्थ्य संगठनों द्वारा प्रमाणित नहीं है।\n2. लोगों में चिंता पैदा करने के लिए सनसनीखेज शब्दों का प्रयोग किया गया है।";
        }

        setMessages((prev) => [...prev, { sender: 'bot', text: botText }]);
      }
    } catch (error) {
      console.error('Chat API Error:', error.message);
      // Fallback message
      setMessages((prev) => [...prev, {
        sender: 'bot',
        text: 'I ran into an error connecting to the service. (Fallback): Verify details independently.'
      }]);
    } finally {
      setLoadingResponse(false);
    }
  };

  return (
    <div className="animate-fade chat-drawer" style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      maxWidth: '450px',
      height: '100vh',
      backgroundColor: 'var(--bg-secondary)',
      borderLeft: '1px solid var(--border-color)',
      boxShadow: 'var(--shadow-xl)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{
        padding: 'var(--space-md) var(--space-lg)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-tertiary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
          <Sparkles size={18} color="var(--color-primary)" />
          <span style={{ fontWeight: 700, fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>
            {language === 'en' ? 'AI Investigation Workspace' : 'एआई जांच कार्यक्षेत्र'}
          </span>
        </div>
        <button onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} aria-label="Close Chat">
          <X size={20} />
        </button>
      </div>

      {/* Message List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--space-lg)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-md)'
      }}>
        {messages.map((msg, idx) => (
          <div 
            key={idx}
            style={{
              alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '85%',
              display: 'flex',
              gap: '8px',
              flexDirection: msg.sender === 'user' ? 'row-reverse' : 'row'
            }}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              {msg.sender === 'user' ? <User size={14} color="white" /> : <Bot size={14} color="var(--color-primary)" />}
            </div>
            
            <div style={{
              backgroundColor: msg.sender === 'user' ? 'var(--color-primary)' : 'var(--bg-tertiary)',
              color: msg.sender === 'user' ? 'white' : 'var(--text-primary)',
              padding: '10px 14px',
              borderRadius: msg.sender === 'user' 
                ? 'var(--radius-lg) 0 var(--radius-lg) var(--radius-lg)' 
                : '0 var(--radius-lg) var(--radius-lg) var(--radius-lg)',
              fontSize: '0.9rem',
              lineHeight: '1.45',
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {loadingResponse && (
          <div style={{ alignSelf: 'flex-start', display: 'flex', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-tertiary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Bot size={14} color="var(--color-primary)" />
            </div>
            <div className="glass" style={{ padding: '10px 14px', borderRadius: 'var(--radius-lg)', display: 'flex', gap: '4px', alignItems: 'center' }}>
              <div className="loader" style={{ width: '12px', height: '12px', borderWidth: '1.5px' }}></div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Analyzing context...</span>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Suggestions */}
      <div style={{
        padding: '0 var(--space-lg)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px',
        marginBottom: '8px'
      }}>
        {suggestions.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s.prompt)}
            className="btn btn-secondary"
            style={{
              padding: '4px 10px',
              fontSize: '0.78rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-tertiary)',
              borderColor: 'var(--border-color)',
              fontWeight: 500
            }}
          >
            <MessageSquare size={10} style={{ marginRight: '2px' }} />
            {language === 'en' ? s.labelEn : s.labelHi}
          </button>
        ))}
      </div>

      {/* Footer Form */}
      <div style={{
        padding: 'var(--space-md) var(--space-lg)',
        borderTop: '1px solid var(--border-color)',
        backgroundColor: 'var(--bg-tertiary)'
      }}>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(inputVal); }}
          style={{ display: 'flex', gap: 'var(--space-sm)' }}
        >
          <input
            type="text"
            className="input-field"
            placeholder={language === 'en' ? 'Ask follow-up questions...' : 'अनुवर्ती प्रश्न पूछें...'}
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            disabled={loadingResponse}
            style={{ padding: '0.65rem 1rem' }}
          />
          <button 
            type="submit" 
            className="btn btn-primary"
            style={{ padding: '0.65rem', borderRadius: 'var(--radius-lg)' }}
            disabled={loadingResponse}
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
}
