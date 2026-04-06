const orderService = require('../services/orderService');
const { createAppError } = require('../utils/AppError');
const { logger } = require('../config/logger');

async function getAllOrders(req, res, next) {
  try {
    logger.info({ requester: req.user ? req.user.id : null, route: req.originalUrl }, 'Get all orders request');
    const orders = await orderService.getAllOrders();
    res.status(200).json(orders);
  } catch (error) {
    next(error);
  }
}

async function getOrderById(req, res, next) {
  try {
    const order = await orderService.getOrderById(req.params.id);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
}

async function createOrder(req, res, next) {
  try {
    const { items, user_id: userIdFromBody, status } = req.body;
    const userId = userIdFromBody || req.user?.id;

    if (!userId) {
      return next(createAppError('Usuario no autenticado', 401));
    }

    const order = await orderService.createOrder({
      userId,
      items,
      status
    });

    res.status(201).json({ message: 'Pedido creado correctamente', order });
  } catch (error) {
    next(error);
  }
}

async function createCheckoutSession(req, res, next) {
  try {
    const { items, success_url: successUrl, cancel_url: cancelUrl } = req.body;

    if (!req.user?.id) {
      return next(createAppError('Usuario no autenticado', 401));
    }

    const session = await orderService.createCheckoutSession({
      userId: req.user.id,
      items,
      successUrl,
      cancelUrl
    });

    logger.info({ userId: req.user.id, orderId: session.orderId }, 'Stripe checkout session created');
    res.status(201).json(session);
  } catch (error) {
    next(error);
  }
}

async function updateOrder(req, res, next) {
  try {
    const order = await orderService.updateOrder(req.params.id, req.body);
    res.status(200).json(order);
  } catch (error) {
    next(error);
  }
}

async function deleteOrder(req, res, next) {
  try {
    const order = await orderService.deleteOrder(req.params.id);
    res.status(200).json({ message: 'Pedido eliminado correctamente', order });
  } catch (error) {
    next(error);
  }
}

async function stripeWebhook(req, res, next) {
  try {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return next(createAppError('Falta la cabecera stripe-signature', 400));
    }

    const response = await orderService.handleStripeWebhook(signature, req.body);
    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  createCheckoutSession,
  updateOrder,
  deleteOrder,
  stripeWebhook
};
