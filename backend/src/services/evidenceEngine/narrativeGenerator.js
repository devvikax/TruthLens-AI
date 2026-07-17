const { orchestrateAiTask } = require('../aiOrchestrator');

/**
 * Step 15: AI Explanation Generator
 * Explains the consensus findings and verdict details in simple English and Hindi.
 * Explains why the claim is true/false, which evidence was used, which was rejected, and why.
 * @param {Object} data - Summarized metrics and citation lists
 * @returns {Promise<Object>} Object containing en and hi summaries
 */
const generateExplanation = async (data) => {
  const rejectedList = data.rejectedList || [];
  
  const prompt = `
    You are an expert bilingual media literacy assistant and judge. Generate a simple, easy-to-read explanation summarizing this content verification session.
    Do NOT use tech jargon. Speak clearly to children and elderly users.
    
    CRITICAL Hallucination Safeguard:
    - You must NEVER invent any sources, citations, or evidence.
    - Ground your explanation EXCLUSIVELY on the provided Verification Dossier Context.
    - If the context indicates evidence is insufficient, state clearly that there is not enough information to reach a high-confidence conclusion.
    - Do not make any claims outside of the provided facts.

    Verification Dossier Context:
    - Overall Trust Score: ${data.trustScore}%
    - Resolved Verdict: ${data.verdict}
    - Supporting Evidence Count: ${data.supportingCount}
    - Contradicting Evidence Count: ${data.contradictingCount}
    
    Accepted Evidence Used:
    ${JSON.stringify(data.evidenceList.map(e => ({ title: e.title, source: e.source, snippet: e.snippet })))}
    
    Rejected Evidence Ignored:
    ${JSON.stringify(rejectedList.map(e => ({ title: e.title, source: e.source, reason: e.reason })))}

    Explain:
    1. Why the claim is resolved as true, false, or needs verification.
    2. Which accepted evidence was used and how it supported the verdict.
    3. Which rejected evidence was ignored and why it was ignored (e.g. low relevance score, mismatched entities, unverified blogs for celebrity death claims).
    4. Practical sharing advice for users.

    Write two independent paragraphs.
    Paragraph 1: English explanation answering what was analyzed, what evidence was found, why this verdict was selected, which sources were used/ignored, and advice on sharing.
    Paragraph 2: Hindi translation of the explanation in simple, natural Devnagari script.

    Output format:
    ===ENGLISH===
    [Your English text here]
    ===HINDI===
    [Your Hindi text here]
  `;

  try {
    const responseText = await orchestrateAiTask('explainableNarrative', prompt, false);
    const parts = responseText.split('===HINDI===');
    const englishPart = parts[0].replace('===ENGLISH===', '').trim();
    const hindiPart = parts[1] ? parts[1].trim() : englishPart;

    return {
      en: englishPart,
      hi: hindiPart
    };
  } catch (err) {
    console.error(`AI Orchestrator narrative generation failed: ${err.message}. Returning fallback.`);
    return getFallbackNarrative(data.trustScore, data.verdict, rejectedList);
  }
};

const getFallbackNarrative = (score, verdict = '', rejectedList = []) => {
  const hasRejected = rejectedList.length > 0;
  const rejectedReasons = hasRejected 
    ? `Some sources (like ${rejectedList.map(r => r.source).slice(0, 2).join(', ')}) were ignored due to ${rejectedList[0].reason || 'mismatched context'}.` 
    : '';

  if (verdict === 'Verified False' || score < 40) {
    return {
      en: `This claim has been verified as false. Trusted public archives and official fact-check registries confirm that the assertions are entirely false or fabricated. ${rejectedReasons} Please do not share this content.`,
      hi: `इस दावे को पूरी तरह से झूठा और फर्जी सत्यापित किया गया है। आधिकारिक संगठनों और तथ्य-जांचकर्ताओं ने पुष्टि की है कि ये दावे पूरी तरह से असत्य हैं। ${rejectedReasons ? 'कुछ असंबद्ध या अविश्वसनीय स्रोतों को खारिज कर दिया गया था।' : ''} कृपया इसे साझा न करें।`
    };
  } else if (verdict === 'Verified True' || score >= 75) {
    return {
      en: `This claim is verified as true. It is backed by multiple independent, highly reputable sources. ${rejectedReasons} You can share this statement freely with confidence.`,
      hi: `यह दावा पूरी तरह से सच और सत्यापित है। इसे कई स्वतंत्र और अत्यधिक विश्वसनीय स्रोतों का समर्थन प्राप्त है। आप इस जानकारी को विश्वास के साथ साझा कर सकते हैं।`
    };
  } else {
    return {
      en: `Caution is advised. A definitive conclusion cannot be reached because the available evidence is insufficient or inconclusive. ${rejectedReasons} We advise against sharing this statement until official sources clarify the situation.`,
      hi: `सावधानी बरतने की सलाह दी जाती है। एक निश्चित निष्कर्ष पर नहीं पहुँचा जा सकता क्योंकि उपलब्ध साक्ष्य अपर्याप्त या अनिर्णायक हैं। आधिकारिक घोषणा होने तक इसे साझा न करें।`
    };
  }
};

module.exports = {
  generateExplanation
};
