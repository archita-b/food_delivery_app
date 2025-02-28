import { wrapControllerWithTryCatch } from "../middleware/utils.js";
import {
  wrappedCancelOrderDB,
  wrappedGetOrderById,
  wrappedPlaceOrderDB,
} from "../model/orders.js";

export const placeOrder = wrapControllerWithTryCatch(async (req, res, next) => {
  const customerId = req.userId;

  const { items } = req.body;

  if (!items?.length) {
    return res.status(400).json({ error: "Items are required." });
  }

  const orderDetails = await wrappedPlaceOrderDB(customerId, items);

  res.status(201).json(orderDetails);
});

export const cancelOrder = wrapControllerWithTryCatch(
  async (req, res, next) => {
    const { id: orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is missing." });
    }

    const order = await wrappedGetOrderById(orderId);
    if (!order) {
      return res.status(404).json({ error: "Order does not exist." });
    }

    if (order.customer_id !== req.userId) {
      return res.status(403).json({
        error: "You are not authorized to cancel the order.",
      });
    }

    await wrappedCancelOrderDB(orderId);
    res.sendStatus(204);
  }
);
