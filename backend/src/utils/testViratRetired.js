require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Override local router DNS for SRV queries
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { runEvidenceEngine } = require('../services/evidenceEngine');

const testVirat = async () => {
  console.log('=== STARTING OFFLINE TARGET TEST: VIRAT KOHLI RETIRED ===\n');
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const claim = 'Virat Kohli retired';
    console.log(`Checking factual claim: "${claim}"`);
    const dossier = await runEvidenceEngine('text', claim);
    
    console.log(`\nResults:`);
    console.log(`- Verdict: ${dossier.metadata.debugLogs.finalVerdict}`);
    console.log(`- Confidence Score: ${dossier.confidenceDetails.score}%`);
    console.log(`- Trust Score: ${dossier.metrics.trustScore}%`);
    console.log(`- Evidence count: ${dossier.evidenceCollected.length}`);
    console.log(`- Stance distribution: Supports=${dossier.evidenceCollected.filter(e => e.stance === 'supports').length}, Contradicts=${dossier.evidenceCollected.filter(e => e.stance === 'contradicts').length}`);
    console.log(`- English narrative: ${dossier.explainableNarrative.en}`);

    if (dossier.metadata.debugLogs.finalVerdict === 'Verified False') {
      console.log('\n✅ TEST PASSED!');
    } else {
      console.log('\n❌ TEST FAILED: Verdict was not classified as "Verified False".');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
};

testVirat();
