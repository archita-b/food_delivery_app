import pool from "./database.js";
import { wrapInTransaction } from "../middleware/utils.js";

export const wrappedGetOrderById = wrapInTransaction(getOrderById);

export const wrappedPlaceOrderDB = wrapInTransaction(placeOrderDB);

export const wrappedCancelOrderDB = wrapInTransaction(cancelOrderDB);

async function getOrderById(id) {
  const result = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
  return result.rows[0];
}

async function placeOrderDB(customerId, items) {
  try {
    const kitchenId = 1;

    const kitchenTimingsResult = await pool.query(
      `SELECT opening_time, closing_time FROM kitchens WHERE id = $1`,
      [kitchenId]
    );

    const { opening_time, closing_time } = kitchenTimingsResult.rows[0];

    const [openHour, openMinute] = opening_time.split(":").map(Number);
    const [closeHour, closeMinute] = closing_time.split(":").map(Number);

    const openingTime = openHour * 60 + openMinute;
    const closingTime = closeHour * 60 + closeMinute;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = currentHour * 60 + currentMinute;

    if (currentTime < openingTime || currentTime > closingTime) {
      throw new Error("Kitchen is closed to take orders.");
    }

    await pool.query("BEGIN");

    const itemIds = items.map((item) => item.item_id);
    const itemQuantites = items.map((item) => item.quantity);

    const stockAvailabilityResult = await pool.query(
      `WITH request_orders AS (
          SELECT * FROM unnest($1::int[], $2::int[]) 
          AS t(item_id, quantity)
        )
        SELECT kitchen_items.item_id FROM kitchen_items
        INNER JOIN request_orders
        ON kitchen_items.item_id = request_orders.item_id
        WHERE kitchen_items.stock >= request_orders.quantity FOR UPDATE`,
      [itemIds, itemQuantites]
    );

    if (stockAvailabilityResult.rows.length < items.length) {
      throw new Error("One or more items are out of stock.");
    }

    const orderResult = await pool.query(
      `INSERT INTO orders (customer_id,kitchen_id) VALUES ($1,$2) RETURNING id`,
      [customerId, 1]
    );

    const { id: orderId } = orderResult.rows[0];

    const orderItemsResult = await pool.query(
      `WITH request_orders AS (
          SELECT * FROM unnest($1::int[], $2::int[]) 
          AS t(item_id, quantity)
        )
        INSERT INTO order_items (order_id, item_id, quantity, price)
        SELECT $3, ro.item_id, ro.quantity, i.price
        FROM request_orders ro
        INNER JOIN items i
        ON ro.item_id = i.id`,
      [itemIds, itemQuantites, orderId]
    );

    const updateStockResult = await pool.query(
      `WITH request_orders AS (
          SELECT * FROM unnest($1::int[], $2::int[]) 
          AS t(item_id, quantity)
        )
          UPDATE kitchen_items 
          SET stock = kitchen_items.stock - request_orders.quantity
          FROM request_orders
          WHERE kitchen_items.item_id = request_orders.item_id`,
      [itemIds, itemQuantites]
    );

    const updatedOrderResult = await pool.query(
      `UPDATE orders SET total_price = (
        SELECT SUM(quantity * price) FROM order_items 
        WHERE order_items.order_id = orders.id
      ), status = 'confirmed'
      WHERE id = $1 RETURNING *`,
      [orderId]
    );

    await pool.query("COMMIT");

    const {
      id,
      customer_id,
      delivery_partner_id,
      kitchen_id,
      status,
      created_at,
    } = updatedOrderResult.rows[0];

    return {
      order_id: id,
      customer_id: customer_id,
      delivery_partner_id: delivery_partner_id,
      kitchen_id: kitchen_id,
      order_status: status,
      created_at: created_at,
    };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
}

async function cancelOrderDB(id) {
  const cancellationWindowMs = 5 * 60 * 1000;

  const orderResult = await pool.query(`SELECT * FROM orders WHERE id = $1`, [
    id,
  ]);

  if (orderResult.rowCount === 0) {
    throw new Error("Order does not exist.");
  }

  const order = orderResult.rows[0];

  const timeOfPlacingOrder = new Date(order.created_at).getTime();
  const timeOfCancellingOrder = Date.now();
  const diff = timeOfCancellingOrder - timeOfPlacingOrder;

  if (diff > cancellationWindowMs) {
    throw new Error("Cancellation window has expired.");
  }

  const result = await pool.query(
    `UPDATE orders SET status = 'cancelled' WHERE id = $1`,
    [id]
  );

  if (result.rowCount !== 1) {
    throw new Error("Error cancelling order.");
  }

  return result.rowCount;
}
