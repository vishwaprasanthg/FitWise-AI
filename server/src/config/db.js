const mongoose = require('mongoose');
const config = require('./env');
const logger = require('../utils/logger');

let isConnected = false;

const connectDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    logger.info('Using existing MongoDB connection');
    return mongoose.connection;
  }

  const isAtlas = config.mongoUri.includes('mongodb+srv') || config.mongoUri.includes('mongodb.net');

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = conn.connection.readyState === 1;
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name} (${isAtlas ? 'MongoDB Atlas Cloud' : 'Local'})`);

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
      isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
      isConnected = true;
    });

    return conn;
  } catch (error) {
    logger.error(`MongoDB Connection Failed (${isAtlas ? 'MongoDB Atlas' : 'Local'}): ${error.message}`);

    // If MongoDB Atlas failed (e.g. IP whitelist / network block), fallback to local MongoDB so dev is uninterrupted
    if (isAtlas) {
      logger.warn('⚠️ MongoDB Atlas could not be reached. Ensure your current IP is in Atlas IP Access List (https://cloud.mongodb.com -> Network Access -> Add IP Address / Allow 0.0.0.0/0).');
      logger.info('Attempting fallback connection to local MongoDB (mongodb://localhost:27017/fitpilot)...');

      try {
        const localConn = await mongoose.connect('mongodb://localhost:27017/fitpilot', {
          serverSelectionTimeoutMS: 3000,
        });

        isConnected = localConn.connection.readyState === 1;
        logger.info(`MongoDB Connected via Local Fallback: ${localConn.connection.host}/${localConn.connection.name}`);
        return localConn;
      } catch (localError) {
        logger.error(`Local MongoDB fallback also failed: ${localError.message}`);
      }
    }

    isConnected = false;
    return null;
  }
};

const getDBStatus = () => {
  const stateMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const readyState = mongoose.connection.readyState;
  return {
    state: stateMap[readyState] || 'unknown',
    readyState,
    isConnected: readyState === 1,
  };
};

module.exports = {
  connectDB,
  getDBStatus,
};
