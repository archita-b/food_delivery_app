import pool from "./database.js";
import { wrapInTransaction } from "../middleware/utils.js";
import { calculateDistance } from "../utils.js/distance.js";
import { quadTree } from "../utils.js/quadTree.js";

export const getOrderById = wrapInTransaction(async function getOrderById(id) {
  const result = await pool.query(`SELECT * FROM orders WHERE id = $1`, [id]);
  return result.rows[0];
});

export const placeOrderDB = wrapInTransaction(async function placeOrderDB(
  customerId,
  items,
  kitchenId
) {
  try {
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

    const itemIds = items.map((item) => item.item_id);
    const itemQuantites = items.map((item) => item.quantity);

    const orderResult = await pool.query(
      `INSERT INTO orders (customer_id,kitchen_id) VALUES ($1,$2) RETURNING id`,
      [customerId, kitchenId]
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
          WHERE kitchen_items.item_id = request_orders.item_id 
          AND kitchen_items.kitchen_id = $3`,
      [itemIds, itemQuantites, kitchenId]
    );

    const updatedOrderResult = await pool.query(
      `UPDATE orders SET total_price = (
        SELECT SUM(quantity * price) FROM order_items 
        WHERE order_items.order_id = orders.id
      ), status = 'confirmed'
      WHERE id = $1 RETURNING *`,
      [orderId]
    );

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
      items: items,
      delivery_partner_id: delivery_partner_id,
      kitchen_id: kitchen_id,
      order_status: status,
      created_at: created_at,
    };
  } catch (error) {
    await pool.query("ROLLBACK");
    throw error;
  }
});

export const cancelOrderDB = wrapInTransaction(async function cancelOrderDB(
  id
) {
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
});

export const assignDeliveryPartnerDB = wrapInTransaction(
  async function assignDeliveryPartnerDB(partnerId, orderId) {
    const partnerCheck = await pool.query(
      `SELECT id FROM delivery_partners WHERE id = $1`,
      [partnerId]
    );

    if (partnerCheck.rowCount === 0) {
      throw new Error("Delivery partner does not exist.");
    }

    await pool.query(
      `UPDATE orders SET delivery_partner_id = $1 WHERE id = $2`,
      [partnerId, orderId]
    );

    await pool.query(
      `UPDATE delivery_partners SET is_available = false WHERE id = $1`,
      [partnerId]
    );

    return { orderId, partnerId };
  }
);

export async function findNearestKitchen(latitude, longitude, items) {
  const itemIds = items.map((item) => item.item_id);
  const itemQuantites = items.map((item) => item.quantity);

  const kitchensResult = await pool.query(
    `WITH request_orders AS (
      SELECT * FROM unnest($1::int[], $2::int[]) AS t(item_id, quantity)
    )
      SELECT ki.kitchen_id, k.lat_long::TEXT, COUNT(ki.item_id) AS available_items
      FROM kitchen_items ki
      INNER JOIN request_orders ro
      ON ki.item_id = ro.item_id
      INNER JOIN kitchens k
      ON ki.kitchen_id = k.id
      WHERE ki.stock >= ro.quantity
      AND k.opening_time <= CURRENT_TIME
      AND k.closing_time >= CURRENT_TIME
      GROUP BY ki.kitchen_id, k.lat_long::TEXT
      HAVING COUNT(ki.item_id) = $3`,
    [itemIds, itemQuantites, items.length]
  );

  if (!kitchensResult.rows.length) {
    throw new Error(
      "Items are either out of stock or no restaurants are open."
    );
  }

  const customerLocation = new Point(latitude, longitude);
  const nearestKitchen = quadTree.findNearest(customerLocation);

  // let nearestKitchen = null;
  // let minDistance = Infinity;

  // for (const kitchen of kitchensResult.rows) {
  //   const [kitchenLat, kitchenLong] = kitchen.lat_long
  //     .replace("(", "")
  //     .replace(")", "")
  //     .split(",")
  //     .map(Number);

  //   const distance = calculateDistance(
  //     latitude,
  //     longitude,
  //     kitchenLat,
  //     kitchenLong
  //   );

  //   if (distance < minDistance) {
  //     nearestKitchen = {
  //       id: kitchen.kitchen_id,
  //       latitude: kitchenLat,
  //       longitude: kitchenLong,
  //     };
  //     minDistance = distance;
  //   }
  // }
  return nearestKitchen;
}
