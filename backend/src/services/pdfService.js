const fs = require('fs');
const pdfParse = require('pdf-parse');

/**
 * Extracts text content from a PDF document
 * @param {string} pdfPath - Absolute path to the PDF file
 * @returns {Promise<string>} Compiled text content
 */
const extractTextFromPdf = async (pdfPath) => {
  try {
    if (!fs.existsSync(pdfPath)) {
      throw new Error(`Target PDF file does not exist at path: ${pdfPath}`);
    }

    const dataBuffer = fs.readFileSync(pdfPath);
    
    // Parse PDF buffer
    const parsedData = await pdfParse(dataBuffer);
    
    // Clean compiled text
    const cleanedText = parsedData.text
      .replace(/[^\S\r\n]+/g, ' ') // collapse multi-spaces but keep lines
      .trim();

    return cleanedText;
  } catch (error) {
    console.error(`PDF Service Error: ${error.message}`);
    throw new Error(`PDF text extraction failure: ${error.message}`);
  }
};

module.exports = { extractTextFromPdf };
