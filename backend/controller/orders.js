import { placeOrderDB } from "../model/orders.js";

export async function placeOrder(req, res, next) {
  try {
    const { item_id: itemId, num_of_items: numOfItems } = req.body;

    if (!itemId || !Number.isInteger(numOfItems) || numOfItems <= 0) {
      return res.status(400).json({ error: "Invalid request data." });
    }

    const customerId = 1; // will come from login info
    const kitchenId = 1;

    const orderDetails = await placeOrderDB(
      customerId,
      kitchenId,
      itemId,
      numOfItems
    );

    res.status(201).json(orderDetails);
  } catch (error) {
    console.log("Error in placeAnOrder controller: ", error.message);
    next(error);
  }
}
