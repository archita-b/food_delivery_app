import pool from "./database.js";

export async function placeOrderDB(customerId, kitchenId, itemId, numOfItems) {
  try {
    await pool.query("BEGIN");

    const priceResult = await pool.query(
      `SELECT price, stock FROM kitchen_items 
      INNER JOIN items ON kitchen_items.item_id = items.id
      WHERE kitchen_id = $1 AND item_id = $2`,
      [kitchenId, itemId]
    );

    if (priceResult.rowCount === 0) {
      throw new Error("Item not found in kitchen.");
    }

    const { price, stock } = priceResult.rows[0];

    if (stock < numOfItems) {
      throw new Error("Item is out of stock.");
    }

    const orderResult = await pool.query(
      `INSERT INTO orders (customer_id) VALUES ($1) RETURNING *`,
      [customerId]
    );

    const { id: orderId } = orderResult.rows[0];

    const orderItemsResult = await pool.query(
      `INSERT INTO order_items (order_id, kitchen_id, item_id, num_of_items, price)
            VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [orderId, kitchenId, itemId, numOfItems, price]
    );

    const totalPrice = numOfItems * price;

    const orderDetailsResult = await pool.query(
      `UPDATE orders SET total_price = $1 WHERE id = $2`,
      [totalPrice, orderId]
    );

    await pool.query(
      `UPDATE kitchen_items SET stock = stock - $1 
            WHERE kitchen_id = $2 AND item_id = $3`,
      [numOfItems, kitchenId, itemId]
    );

    await pool.query("COMMIT");

    const orderDetails = await pool.query(
      `SELECT * FROM orders WHERE id = $1`,
      [orderId]
    );

    return orderDetails.rows[0];
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}
