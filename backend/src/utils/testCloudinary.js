require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { uploadToCloudinary, isCloudinaryConfigured } = require('../services/cloudinaryService');

const runCloudinaryTest = async () => {
  console.log('=== STARTING CLOUDINARY UPLOAD TEST ===\n');

  console.log(`- Credentials Configured: ${isCloudinaryConfigured() ? 'YES' : 'NO'}`);
  if (!isCloudinaryConfigured()) {
    console.error('❌ Cloudinary variables are not configured in your .env file.');
    return;
  }

  // 1. Create a temporary dummy file to upload
  const tempFilePath = path.join(__dirname, '../../uploads/cloudinaryTest.txt');
  try {
    fs.writeFileSync(tempFilePath, 'TruthLens AI - Cloudinary Connection Test Payload');
    console.log(`- Temporary test file created at: ${tempFilePath}`);
  } catch (err) {
    console.error(`❌ Failed to create temporary file: ${err.message}`);
    return;
  }

  // 2. Trigger Cloudinary upload helper
  console.log('- Submitting file upload to Cloudinary cluster...');
  try {
    const secureUrl = await uploadToCloudinary(tempFilePath);
    if (secureUrl) {
      console.log(`✅ Cloudinary Upload Succeeded!`);
      console.log(`🔗 Secure Remote URL: ${secureUrl}`);
    } else {
      console.error('❌ Cloudinary Upload failed (returned null secure URL).');
    }
  } catch (err) {
    console.error(`❌ Cloudinary Upload encountered error: ${err.message}`);
  } finally {
    // 3. Clean up local test file
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
        console.log('- Local temporary test file cleaned successfully.');
      }
    } catch (err) {
      console.warn(`Warning: Could not delete temporary file: ${err.message}`);
    }
  }

  console.log('\n=== CLOUDINARY UPLOAD TEST COMPLETE ===');
};

runCloudinaryTest();
