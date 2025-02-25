import { cancelOrderDB, placeOrderDB } from "../model/orders.js";

export async function placeOrder(req, res, next) {
  try {
    const { items } = req.body;

    if (!items?.length) {
      return res.status(400).json({ error: "Items are required." });
    }

    const customerId = 1; // will come from login info

    const orderDetails = await placeOrderDB(customerId, items);

    res.status(201).json(orderDetails);
  } catch (error) {
    console.log("Error in placeAnOrder controller: ", error.message);

    if (error.message === "One or more items are out of stock.") {
      return res.status(409).json({ error: error.message });
    }

    next(error);
  }
}

export async function cancelOrder(req, res, next) {
  try {
    const { id: orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({ error: "Order ID is missing." });
    }

    await cancelOrderDB(orderId);
    res.sendStatus(204);
  } catch (error) {
    console.log("Error in cancelOrder controller: ", error.message);

    if (error.message === "Order does not exist.") {
      return res.status(404).json({ error: error.message });
    }

    if (error.message === "Cancellation window has expired.") {
      return res.status(403).json({ error: error.message });
    }

    next(error);
  }
}
