import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, Lock, Award, Heart, Mail } from 'lucide-react';
import { useAnalysisStore } from '../store/analysisStore';

export default function About() {
  const { language } = useAnalysisStore();
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  const faqs = [
    {
      qEn: "How is the Trust Score calculated?",
      qHi: "ट्रस्ट स्कोर की गणना कैसे की जाती है?",
      aEn: "Our Trust Score is a weighted combination of source reputation (checking links against credibility whitelist/blacklist), sentiment objectivity (flagging emotional triggers), and direct matches in verified global fact-checking registries.",
      aHi: "हमारा ट्रस्ट स्कोर स्रोत की प्रतिष्ठा (विश्वसनीयता सूची के खिलाफ लिंक की जांच), भावना निष्पक्षता (भावनात्मक भाषा की पहचान), और सत्यापित वैश्विक तथ्य-जांच रजिस्ट्रियों में सीधे मिलान का एक भारित संयोजन है।"
    },
    {
      qEn: "Does TruthLens-AI block or delete fake news?",
      qHi: "क्या ट्रुथलेंस-एआई फर्जी खबरों को ब्लॉक या डिलीट करता है?",
      aEn: "No. TruthLens-AI does not delete, block, or censor any content. We believe in media literacy. We explain WHY content might be biased or unverified and provide official references so you can make your own informed decision.",
      aHi: "नहीं। ट्रुथलेंस-एआई किसी भी सामग्री को हटाता, ब्लॉक या सेंसर नहीं करता है। हम मीडिया साक्षरता में विश्वास करते हैं। हम समझाते हैं कि सामग्री क्यों पक्षपाती या असत्यापित हो सकती है और आधिकारिक संदर्भ प्रदान करते हैं ताकि आप स्वयं सोच-समझकर निर्णय ले सकें।"
    },
    {
      qEn: "Is my pasted content saved?",
      qHi: "क्या मेरा पेस्ट किया गया टेक्स्ट सुरक्षित रखा जाता है?",
      aEn: "For Guest users, content is processed in-memory and discarded. Logged-in users can choose to save analyses in their account dashboard for convenient offline review.",
      aHi: "अतिथि (Guest) उपयोगकर्ताओं के लिए, सामग्री केवल रैम (in-memory) में संसाधित की जाती है और हटा दी जाती है। लॉग-इन उपयोगकर्ता भविष्य में देखने के लिए अपने इतिहास में विश्लेषण सहेजना चुन सकते हैं।"
    }
  ];

  return (
    <div className="container animate-fade" style={{ padding: 'var(--space-2xl) 0', display: 'flex', flexDirection: 'column', gap: 'var(--space-2xl)' }}>
      
      {/* Title */}
      <section style={{ textAlign: 'center', maxWidth: '700px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: 'var(--space-sm)' }}>
          {language === 'en' ? 'Our Mission & Vision' : 'हमारा उद्देश्य और दृष्टिकोण'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
          {language === 'en'
            ? 'TruthLens-AI was built to encourage responsible media consumption. We bridge the gap between complex fact-checking databases and everyday social sharing.'
            : 'ट्रुथलेंस-एआई का निर्माण जिम्मेदार मीडिया उपभोग को बढ़ावा देने के लिए किया गया था। हम जटिल तथ्य-जांच डेटाबेस और रोज़मर्रा की सोशल शेयरिंग के बीच की खाई को पाटने का काम करते हैं।'}
        </p>
      </section>

      {/* Core values cards */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-lg)'
      }}>
        <div className="glass-card" style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <Award size={36} color="var(--color-primary)" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
              {language === 'en' ? 'Explainable Logic' : 'व्याख्यात्मक तर्क'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              {language === 'en'
                ? 'We avoid binary labels. We break down parameters like bias, emotion, and source citations clearly.'
                : 'हम बाइनरी लेबल (सत्य/असत्य) से बचते हैं। हम पूर्वाग्रह, भावना और स्रोत उद्धरणों को स्पष्ट रूप से समझाते हैं।'}
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <Lock size={36} color="var(--color-success)" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
              {language === 'en' ? 'Privacy First' : 'गोपनीयता सर्वोपरि'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              {language === 'en'
                ? 'Check anything without registering. No tracking cookies or logging of search scripts.'
                : 'बिना पंजीकरण के कुछ भी जांचें। कोई ट्रैकिंग कुकीज़ या सर्च स्क्रिप्ट लॉगिंग नहीं की जाती है।'}
            </p>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', gap: 'var(--space-md)' }}>
          <Heart size={36} color="var(--color-danger)" style={{ flexShrink: 0 }} />
          <div>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '6px' }}>
              {language === 'en' ? 'Bilingual Ingestion' : 'द्विभाषी सामग्री'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
              {language === 'en'
                ? 'Supports both English and Hindi. Ideal for regional WhatsApp forward checks.'
                : 'अंग्रेजी और हिंदी दोनों का समर्थन करता है। क्षेत्रीय व्हाट्सएप संदेशों की जांच के लिए आदर्श है।'}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Accordions */}
      <section style={{ maxWidth: '700px', margin: '0 auto', width: '100%' }}>
        <h2 style={{ fontSize: '1.75rem', textAlign: 'center', marginBottom: 'var(--space-xl)' }}>
          {language === 'en' ? 'Frequently Asked Questions' : 'अक्सर पूछे जाने वाले प्रश्न'}
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="glass" 
                style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: 'var(--space-md) var(--space-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    backgroundColor: isOpen ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
                    transition: 'background-color var(--transition-fast)',
                    textAlign: 'left'
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: '0.98rem' }}>
                    {language === 'en' ? faq.qEn : faq.qHi}
                  </span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div style={{
                    padding: 'var(--space-md) var(--space-lg)',
                    backgroundColor: 'var(--bg-secondary)',
                    borderTop: '1px solid var(--border-color)',
                    fontSize: '0.9rem',
                    color: 'var(--text-secondary)',
                    lineHeight: '1.5'
                  }}>
                    {language === 'en' ? faq.aEn : faq.aHi}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact Panel */}
      <section className="glass-card" style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto', padding: 'var(--space-xl)' }}>
        <Mail size={32} color="var(--color-primary)" style={{ margin: '0 auto var(--space-sm) auto' }} />
        <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--space-xs)' }}>
          {language === 'en' ? 'Contact Support' : 'हमसे संपर्क करें'}
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-md)' }}>
          {language === 'en' 
            ? 'Have suggestions or want to report a bug? Email us at support@truthlens.ai'
            : 'सुझाव देना चाहते हैं या बग रिपोर्ट करना चाहते हैं? हमें support@truthlens.ai पर ईमेल करें'}
        </p>
      </section>

    </div>
  );
}
