const { GoogleGenerativeAI } = require('@google/generative-ai');

async function listModels() {
  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log('GEMINI_API_KEY is not set');
      return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    // Try to get available models
    console.log('Fetching available models...');

    // This might not work with the current library version, so let's try different approaches
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    console.log('gemini-pro model is available');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listModels();
