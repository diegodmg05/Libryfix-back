const supabase = require('../config/supabase');
const stripe = require('../config/stripe');
const { logger } = require('../config/logger');
const { createAppError } = require('../utils/AppError');

function normalizeAmount(value) {
  return Math.round(Number(value) * 100);
}

async function getBooksForOrder(bookIds) {
  const { data, error } = await supabase
    .from('Books')
    .select('id, title, price, stock, status')
    .in('id', bookIds);

  if (error) {
    logger.error({ error: error.message, bookIds }, 'Error getting books for order');
    throw createAppError('No se pudieron obtener los libros del pedido', 500, error.message);
  }

  return data || [];
}

async function getOrderWithDetails(orderId) {
  const { data: order, error: orderError } = await supabase
    .from('Orders')
    .select('id, user_id, status, total, created_at')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError) {
    logger.error({ error: orderError.message, orderId }, 'Error getting order');
    throw createAppError('No se pudo obtener el pedido', 500, orderError.message);
  }

  if (!order) {
    throw createAppError('Pedido no encontrado', 404);
  }

  const { data: details, error: detailsError } = await supabase
    .from('Order_details')
    .select('id, order_id, book_id, quantity, total, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (detailsError) {
    logger.error({ error: detailsError.message, orderId }, 'Error getting order details');
    throw createAppError('No se pudieron obtener los detalles del pedido', 500, detailsError.message);
  }

  return {
    ...order,
    details: details || []
  };
}

async function getAllOrders() {
  const { data: orders, error } = await supabase
    .from('Orders')
    .select('id, user_id, status, total, created_at')
    .order('created_at', { ascending: false });

  if (error) {
    logger.error({ error: error.message }, 'Error getting orders');
    throw createAppError('No se pudieron obtener los pedidos', 500, error.message);
  }

  return Promise.all((orders || []).map((order) => getOrderWithDetails(order.id)));
}

async function getOrderById(orderId) {
  return getOrderWithDetails(orderId);
}

async function createPendingOrder({ userId, items }) {
  if (!Array.isArray(items) || items.length === 0) {
    throw createAppError('Debes enviar al menos un libro para crear el pedido', 400);
  }

  const sanitizedItems = items.map((item) => ({
    book_id: item.book_id,
    quantity: Number(item.quantity)
  }));

  const invalidItem = sanitizedItems.find(
    (item) => !item.book_id || !Number.isInteger(item.quantity) || item.quantity <= 0
  );

  if (invalidItem) {
    throw createAppError('Cada item debe incluir book_id y quantity mayor que 0', 400);
  }

  const uniqueBookIds = [...new Set(sanitizedItems.map((item) => item.book_id))];
  const books = await getBooksForOrder(uniqueBookIds);

  if (books.length !== uniqueBookIds.length) {
    throw createAppError('Uno o varios libros no existen', 404);
  }

  const booksMap = new Map(books.map((book) => [book.id, book]));

  const enrichedItems = sanitizedItems.map((item) => {
    const book = booksMap.get(item.book_id);

    if (!book.status) {
      throw createAppError(`El libro ${book.title} no está disponible`, 400);
    }

    if (book.stock !== null && book.stock !== undefined && item.quantity > book.stock) {
      throw createAppError(`No hay stock suficiente para ${book.title}`, 400);
    }

    const unitPrice = Number(book.price);
    const total = Number((unitPrice * item.quantity).toFixed(2));

    return {
      book_id: book.id,
      title: book.title,
      quantity: item.quantity,
      unit_price: unitPrice,
      total
    };
  });

  const orderTotal = Number(
    enrichedItems.reduce((sum, item) => sum + item.total, 0).toFixed(2)
  );

  const { data: order, error: orderError } = await supabase
    .from('Orders')
    .insert([
      {
        user_id: userId,
        status: 'pending',
        total: orderTotal
      }
    ])
    .select('id, user_id, status, total, created_at')
    .single();

  if (orderError || !order) {
    logger.error({ error: orderError?.message, userId }, 'Error creating order');
    throw createAppError('No se pudo crear el pedido', 500, orderError?.message);
  }

  const detailsPayload = enrichedItems.map((item) => ({
    order_id: order.id,
    book_id: item.book_id,
    quantity: item.quantity,
    total: item.total
  }));

  const { error: detailsError } = await supabase
    .from('Order_details')
    .insert(detailsPayload);

  if (detailsError) {
    logger.error({ error: detailsError.message, orderId: order.id }, 'Error creating order details');
    throw createAppError('No se pudieron crear los detalles del pedido', 500, detailsError.message);
  }

  return {
    order,
    items: enrichedItems
  };
}

async function createOrder({ userId, items, status }) {
  const { order } = await createPendingOrder({ userId, items });

  if (status && status !== 'pending') {
    await updateOrderStatus(order.id, status);
  }

  return getOrderWithDetails(order.id);
}

async function createCheckoutSession({ userId, items, successUrl, cancelUrl }) {
  if (!successUrl || !cancelUrl) {
    throw createAppError('success_url y cancel_url son obligatorias', 400);
  }

  const { order, items: orderItems } = await createPendingOrder({ userId, items });
  let session;

  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      success_url: successUrl,
      cancel_url: cancelUrl,
      client_reference_id: order.id,
      metadata: {
        order_id: order.id,
        user_id: userId,
        items: JSON.stringify(
          orderItems.map((item) => ({
            book_id: item.book_id,
            quantity: item.quantity
          }))
        )
      },
      payment_intent_data: {
        metadata: {
          order_id: order.id,
          user_id: userId
        }
      },
      line_items: orderItems.map((item) => ({
        price_data: {
          currency: 'eur',
          product_data: {
            name: item.title
          },
          unit_amount: normalizeAmount(item.unit_price)
        },
        quantity: item.quantity
      }))
    });
  } catch (error) {
    await updateOrderStatus(order.id, 'checkout_failed');
    logger.error({ error: error.message, orderId: order.id }, 'Error creating Stripe checkout session');
    throw createAppError('No se pudo crear la sesión de pago con Stripe', 500, error.message);
  }

  const { error: updateOrderError } = await supabase
    .from('Orders')
    .update({ status: 'checkout_created' })
    .eq('id', order.id);

  if (updateOrderError) {
    logger.warn(
      { error: updateOrderError.message, orderId: order.id, sessionId: session.id },
      'Checkout session created but order status could not be updated'
    );
  }

  return {
    orderId: order.id,
    sessionId: session.id,
    url: session.url
  };
}

async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('Orders')
    .update({ status })
    .eq('id', orderId)
    .select('id, status')
    .maybeSingle();

  if (error) {
    logger.error({ error: error.message, orderId, status }, 'Error updating order status');
    throw createAppError('No se pudo actualizar el estado del pedido', 500, error.message);
  }

  return data;
}

async function updateOrder(orderId, { user_id, status, total }) {
  const updateData = {};

  if (user_id !== undefined) updateData.user_id = user_id;
  if (status !== undefined) updateData.status = status;
  if (total !== undefined) updateData.total = Number(total);

  if (Object.keys(updateData).length === 0) {
    throw createAppError('Debes enviar al menos un campo para actualizar el pedido', 400);
  }

  const { data, error } = await supabase
    .from('Orders')
    .update(updateData)
    .eq('id', orderId)
    .select('id')
    .maybeSingle();

  if (error) {
    logger.error({ error: error.message, orderId, updateData }, 'Error updating order');
    throw createAppError('No se pudo actualizar el pedido', 500, error.message);
  }

  if (!data) {
    throw createAppError('Pedido no encontrado', 404);
  }

  return getOrderWithDetails(orderId);
}

async function deleteOrder(orderId) {
  const existingOrder = await getOrderWithDetails(orderId);

  const { error: detailsError } = await supabase
    .from('Order_details')
    .delete()
    .eq('order_id', orderId);

  if (detailsError) {
    logger.error({ error: detailsError.message, orderId }, 'Error deleting order details');
    throw createAppError('No se pudieron eliminar los detalles del pedido', 500, detailsError.message);
  }

  const { data, error } = await supabase
    .from('Orders')
    .delete()
    .eq('id', orderId)
    .select('id')
    .maybeSingle();

  if (error) {
    logger.error({ error: error.message, orderId }, 'Error deleting order');
    throw createAppError('No se pudo eliminar el pedido', 500, error.message);
  }

  if (!data) {
    throw createAppError('Pedido no encontrado', 404);
  }

  return existingOrder;
}

async function handleStripeWebhook(signature, rawBody) {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    throw createAppError('Falta STRIPE_WEBHOOK_SECRET para verificar el webhook de Stripe', 500);
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    logger.warn({ error: error.message }, 'Invalid Stripe webhook signature');
    throw createAppError(`Firma de Stripe no válida: ${error.message}`, 400);
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const orderId = session.metadata?.order_id || session.client_reference_id;

      if (!orderId) {
        logger.warn({ sessionId: session.id }, 'Stripe session completed without order reference');
        break;
      }

      await updateOrderStatus(orderId, 'paid');
      logger.info({ orderId, sessionId: session.id }, 'Order marked as paid from checkout.session.completed');
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;
      const orderId = session.metadata?.order_id || session.client_reference_id;

      if (orderId) {
        await updateOrderStatus(orderId, 'expired');
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata?.order_id;

      if (orderId) {
        await updateOrderStatus(orderId, 'payment_failed');
      }
      break;
    }

    default:
      logger.info({ eventType: event.type }, 'Unhandled Stripe webhook event');
      break;
  }

  return { received: true };
}

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrder,
  deleteOrder,
  createCheckoutSession,
  handleStripeWebhook
};
