const express = require('express');
const authMiddleware = require('../middlewares/authMiddleware');
const {
  getAllOrders,
  getOrderById,
  createOrder,
  createCheckoutSession,
  updateOrder,
  deleteOrder,
  stripeWebhook
} = require('../controllers/orderController');

const router = express.Router();

router.post('/webhook', stripeWebhook);
router.get('/getOrders', authMiddleware, getAllOrders);
router.get('/getOrder/:id', authMiddleware, getOrderById);
router.post('/createOrder', authMiddleware, createOrder);
router.post('/checkout-session', authMiddleware, createCheckoutSession);
router.put('/updateOrder/:id', authMiddleware, updateOrder);
router.delete('/deleteOrder/:id', authMiddleware, deleteOrder);

module.exports = router;
