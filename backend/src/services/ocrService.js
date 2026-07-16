const Tesseract = require('tesseract.js');
const fs = require('fs');

/**
 * Extracts text from an image using Tesseract OCR
 * @param {string} imagePath - Absolute path to the uploaded image file
 * @returns {Promise<string>} Digitized text content
 */
const extractTextFromImage = async (imagePath) => {
  try {
    if (!fs.existsSync(imagePath)) {
      throw new Error(`Target image file does not exist at path: ${imagePath}`);
    }

    // Run OCR with English and Hindi training datasets
    const { data: { text } } = await Tesseract.recognize(
      imagePath,
      'eng+hin', // English + Hindi support
      {
        logger: (m) => {
          // Can log OCR progress in development if needed
          if (m.status === 'recognizing text' && m.progress % 0.25 === 0) {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      }
    );

    // Clean OCR output (strip excessive spaces, repair typical OCR symbol errors)
    const cleanedText = text
      .replace(/\r\n/g, '\n')
      .replace(/[^\S\r\n]+/g, ' ') // collapse multi-spaces but keep lines
      .trim();

    return cleanedText;
  } catch (error) {
    console.error(`OCR Service Error: ${error.message}`);
    throw new Error(`OCR processing failure: ${error.message}`);
  }
};

module.exports = { extractTextFromImage };
