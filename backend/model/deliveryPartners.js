import pool from "./database.js";
import { wrapInTransaction } from "../middleware/utils.js";

export const getAvailableDeliveryPartners = wrapInTransaction(
  async function getAvailableDeliveryPartners() {
    const result = await pool.query(
      `SELECT * FROM delivery_partners WHERE is_available = true`
    );
    return result.rows;
  }
);

export const updateAvailabilityDB = wrapInTransaction(
  async function updateAvailabilityDB(id, isAvailable) {
    const availabilityResult = await pool.query(
      `UPDATE delivery_partners SET is_available = $1 WHERE id = $2 RETURNING *`,
      [isAvailable, id]
    );
    return availabilityResult.rows[0].is_available;
  }
);
