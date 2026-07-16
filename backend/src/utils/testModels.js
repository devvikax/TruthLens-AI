require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const testModels = async () => {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Gemini API Key:', apiKey ? 'FOUND' : 'MISSING');
  if (!apiKey) return;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // We can list models using fetch to bypass SDK details
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const response = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await response.json();
    
    if (response.ok) {
      console.log('Available models for this key:');
      if (data.models) {
        data.models.slice(0, 10).forEach(m => {
          console.log(`- Name: ${m.name}, DisplayName: ${m.displayName}, SupportedMethods: ${m.supportedGenerationMethods.join(', ')}`);
        });
      } else {
        console.log('No models listed:', JSON.stringify(data));
      }
    } else {
      console.log('Failed to fetch models:', JSON.stringify(data));
    }
  } catch (err) {
    console.error('Error listing models:', err.message);
  }
};

testModels();
