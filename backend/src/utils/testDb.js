require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const dns = require('dns');

// Override local router DNS for SRV queries
dns.setServers(['8.8.8.8', '8.8.4.4']);

const testConnection = async () => {
  console.log('=== STARTING MONGOOSE ATLAS CONNECTION TEST ===\n');
  console.log('Target URI:', process.env.MONGODB_URI ? 'FOUND' : 'MISSING');

  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set in your .env file.');
    return;
  }

  try {
    console.log('Attempting to connect to MongoDB Atlas cluster...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`\n✅ MongoDB Atlas Connection Succeeded!`);
    console.log(`- Connection Host: ${conn.connection.host}`);
    console.log(`- Database Name: ${conn.connection.name}`);
    await mongoose.disconnect();
    console.log('- Connection closed successfully.');
  } catch (error) {
    console.error(`\n❌ MongoDB Atlas Connection Failed: ${error.message}`);
    console.error('\nTips to fix:');
    console.error('1. Check if the password is correct.');
    console.error('2. Ensure Network Access in MongoDB Atlas allows connection from "0.0.0.0/0" (anywhere).');
  }

  console.log('\n=== ATLAS CONNECTION TEST COMPLETE ===');
};

testConnection();
