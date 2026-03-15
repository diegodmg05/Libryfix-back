require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('./src/config/env');

const { logger } = require('./src/config/logger');

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  logger.info(`🚀 Servidor en http://localhost:${PORT}`);
});
