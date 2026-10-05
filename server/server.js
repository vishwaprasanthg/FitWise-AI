const app = require('./src/app');
const config = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');

const startServer = async () => {
  try {
    // Attempt database connection
    await connectDB();

    const server = app.listen(config.port, () => {
      logger.info(`🚀 FitPilot AI Server running on port ${config.port} in [${config.nodeEnv}] mode`);
      logger.info(`Health check available at: http://localhost:${config.port}/api/health`);
    });

    // Graceful shutdown handling
    const shutdown = () => {
      logger.info('Shutting down FitPilot AI server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
