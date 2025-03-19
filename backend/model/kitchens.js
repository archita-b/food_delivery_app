import { wrapInTransaction } from "../middleware/utils.js";
import pool from "./database.js";

export const getKitchens = wrapInTransaction(async function getKitchens() {
  const kitchensResult = await pool.query(
    `SELECT id, lat_long, opening_time, closing_time FROM kitchens`
  );

  if (!kitchensResult.rows.length) {
    throw new Error("No kitchens found.");
  }

  return kitchensResult.rows;
});

export const getOpenKitchensWithStock = wrapInTransaction(
  async function getOpenKitchensWithStock(items) {
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

    return kitchensResult.rows;
  }
);
