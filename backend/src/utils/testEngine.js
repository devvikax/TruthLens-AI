require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Override local router DNS for SRV queries
dns.setServers(['8.8.8.8', '8.8.4.4']);

const { runEvidenceEngine } = require('../services/evidenceEngine');

const runDiag = async () => {
  console.log('=== STARTING EVIDENCE ENGINE PIPELINE DIAGNOSTIC CHECK ===\n');
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Mongoose connected.\n');

    const testInput = 'drinking lemon juice with baking soda in hot water completely cures and prevents all viral infections.';
    console.log(`Executing runEvidenceEngine for: "${testInput}"\n`);
    
    const dossier = await runEvidenceEngine('text', testInput);
    
    console.log('\n✅ Pipeline Succeeded! Dossier generated:');
    console.log(`- Title: ${dossier.title}`);
    console.log(`- Trust Score: ${dossier.metrics.trustScore}%`);
    console.log(`- Decomposed Claims: ${dossier.decomposedClaims.length}`);
    console.log(`- Evidence Collected: ${dossier.evidenceCollected.length}`);
    console.log(`- Confidence Score: ${dossier.confidenceDetails.score}%`);
    console.log(`- Graph Nodes Count: ${dossier.evidenceGraph.nodes.length}`);

  } catch (err) {
    console.error('\n❌ PIPELINE DIAGNOSTIC FAILS WITH ERROR:');
    console.error(err.stack || err);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoose disconnected. Diagnostic complete.');
  }
};

runDiag();
