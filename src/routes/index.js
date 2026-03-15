const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.get('/', (req, res) => res.send('API funcionando 🚀'));

router.use('/auth', authRoutes);
router.use('/users', userRoutes);

module.exports = router;
