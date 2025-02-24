import pool from "./database.js";

export async function placeOrderDB(customerId, items) {
  try {
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
    // console.log(result);

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
