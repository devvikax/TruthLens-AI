/**
 * Step 1: Input Processor
 * Validates, cleans formatting, and strips HTML markup from raw texts or links
 */

const cleanText = (text = '') => {
  if (typeof text !== 'string') return '';
  
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/[\r\n]+/g, '\n') // Normalize multiple line breaks to single
    .replace(/\s+/g, ' ') // Collapse multiple spaces
    .trim();
};

const validateInput = (type, content) => {
  const errors = [];
  if (!type) errors.push('Input type is required');
  if (!content && type !== 'image' && type !== 'pdf') {
    errors.push('Input text content is required');
  }

  const allowedTypes = ['text', 'url', 'image', 'pdf', 'video'];
  if (type && !allowedTypes.includes(type)) {
    errors.push(`Invalid input type: ${type}`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

module.exports = {
  cleanText,
  validateInput
};
