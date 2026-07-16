const cloudinary = require('cloudinary').v2;
const fs = require('fs');

// Configure Cloudinary using environment variables
const isConfigured = () => {
  const name = process.env.CLOUDINARY_CLOUD_NAME;
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  
  return (
    name && name !== 'your_cloudinary_cloud_name' &&
    key && key !== 'your_cloudinary_api_key' &&
    secret && secret !== 'your_cloudinary_api_secret'
  );
};

if (isConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
} else {
  console.warn('Cloudinary variables are not fully configured. Falling back to local storage.');
}

/**
 * Uploads a local file to Cloudinary
 * @param {string} localFilePath - Path to the local temporary file
 * @returns {Promise<string|null>} Secure remote URL, or null if upload fails
 */
const uploadToCloudinary = async (localFilePath) => {
  try {
    if (!isConfigured()) {
      return null;
    }

    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File does not exist at local path: ${localFilePath}`);
    }

    // Upload file (auto-detect resource type for screenshots/PDFs)
    const result = await cloudinary.uploader.upload(localFilePath, {
      folder: 'truthlens_uploads',
      resource_type: 'auto',
    });

    return result.secure_url;
  } catch (error) {
    console.error(`Cloudinary Upload Error: ${error.message}`);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  isCloudinaryConfigured: isConfigured,
};
