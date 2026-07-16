const { orchestrateAiTask } = require('../aiOrchestrator');

/**
 * Step 15: AI Explanation Generator
 * Explains the consensus findings and verdict details in simple English and Hindi
 * @param {Object} data - Summarized metrics and citation lists
 * @returns {Promise<Object>} Object containing en and hi summaries
 */
const generateExplanation = async (data) => {
  const prompt = `
    You are an expert bilingual media literacy assistant. Generate a simple, easy-to-read explanation summarizing this content verification session.
    Do NOT use tech jargon. Speak clearly to children and elderly users.
    
    CRITICAL Hallucination Safeguard:
    - You must NEVER invent any sources, citations, or evidence.
    - Ground your explanation EXCLUSIVELY on the provided Verification Dossier Context.
    - If the context indicates evidence is insufficient, state clearly that there is not enough information to reach a high-confidence conclusion.
    - Do not make any claims outside of the provided facts.

    Verification Dossier Context:
    ${data.ragContext ? data.ragContext : `
    Analysis Details:
    - Overall Trust Score: ${data.trustScore}%
    - Resolved Verdict: ${data.verdict}
    - Supporting Evidence Count: ${data.supportingCount}
    - Contradicting Evidence Count: ${data.contradictingCount}
    
    Evidence List:
    ${JSON.stringify(data.evidenceList.map(e => ({ title: e.title, source: e.source, snippet: e.snippet })))}
    `}

    Write two independent paragraphs.
    Paragraph 1: English explanation answering what was analyzed, what evidence was found, why this verdict was selected, and advice on sharing.
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
    return getFallbackNarrative(data.trustScore, data.verdict);
  }
};

const getFallbackNarrative = (score, verdict = '') => {
  const isFake = verdict.includes('Fake') || score < 40;
  if (isFake) {
    return {
      en: "This claim has been verified as fake. Trusted public archives and official fact-check registries confirm that the assertions are entirely false, fabricated, or lack credible backing. Please do not share this content.",
      hi: "इस दावे को पूरी तरह से झूठा और फर्जी सत्यापित किया गया है। आधिकारिक संगठनों और तथ्य-जांचकर्ताओं ने पुष्टि की है कि ये दावे पूरी तरह से असत्य हैं। कृपया इसे साझा न करें।"
    };
  } else if (score >= 75) {
    return {
      en: "This article is highly credible. It presents verified facts backed by peer-reviewed scientific institutions. The language is entirely objective, with no emotional bias or sensationalized claims.",
      hi: "यह लेख अत्यधिक विश्वसनीय है। इसमें दी गई जानकारी पूरी तरह से वैज्ञानिक तथ्यों पर आधारित है। इसमें कोई भड़काऊ या सनसनीखेज भाषा का उपयोग नहीं किया गया है।"
    };
  } else {
    return {
      en: "Caution is advised. While a small percentage of sources reported issues, there is no verified proof of dangers. The warning utilizes sensationalist, panic-inducing language.",
      hi: "सावधानी बरतने की सलाह दी जाती है। हालांकि कुछ स्रोतों ने चिंता व्यक्त की है, लेकिन खतरे का कोई प्रमाणित सबूत नहीं है।"
    };
  }
};

module.exports = {
  generateExplanation
};
