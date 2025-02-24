import { placeOrderDB } from "../model/orders.js";

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
    next(error);
  }
}
