require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Override local router DNS for SRV queries
dns.setServers(['8.8.8.8', '8.8.4.4']);
const { runEvidenceEngine } = require('../services/evidenceEngine');

const testNonFactual = async () => {
  console.log('=== STARTING NON-FACTUAL CLAIM CHECK TEST ===\n');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const greetingText = 'Good morning my friends';
    console.log(`Checking non-factual input: "${greetingText}"`);
    const dossier = await runEvidenceEngine('text', greetingText);
    
    console.log(`\nResults:`);
    console.log(`- Verdict: ${dossier.metadata.debugLogs.finalVerdict}`);
    console.log(`- Confidence Score: ${dossier.confidenceDetails.score}%`);
    console.log(`- Evidence count: ${dossier.evidenceCollected.length}`);
    console.log(`- English narrative: ${dossier.explainableNarrative.en}`);

    if (dossier.metadata.debugLogs.finalVerdict === 'Not a Factual Claim') {
      console.log('\n✅ TEST PASSED!');
    } else {
      console.log('\n❌ TEST FAILED: Verdict was not classified as "Not a Factual Claim".');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

testNonFactual();
