require('dotenv').config({ path: require('path').join(__dirname, '.env') });
require('./src/config/env');

const app = require('./src/app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor en http://localhost:${PORT}`);
});
