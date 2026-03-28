const express = require('express');
const authRoutes = require('./authRoutes');
const categoriesRoutes = require('./categoriesRoutes');
const userRoutes = require('./userRoutes');

const router = express.Router();

router.get('/', (req, res) => res.send('API funcionando 🚀'));

router.use('/auth', authRoutes);
router.use('/categories', categoriesRoutes);
router.use('/users', userRoutes);

module.exports = router;
