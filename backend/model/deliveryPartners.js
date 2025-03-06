import pool from "./database.js";
import { wrapInTransaction } from "../middleware/utils.js";

export const updateAvailabilityDB = wrapInTransaction(
  async function updateAvailabilityDB(id, isAvailable) {
    const availabilityResult = await pool.query(
      `UPDATE delivery_partners SET is_available = $1 WHERE id = $2 RETURNING *`,
      [isAvailable, id]
    );
    return availabilityResult.rows[0].is_available;
  }
);
