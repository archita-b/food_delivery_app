import { wrapInTransaction } from "../middleware/utils.js";
import pool from "./database.js";

export const wrappedGetItemsDB = wrapInTransaction(getItemsDB);

async function getItemsDB() {
  const result = await pool.query(`SELECT * FROM items`);
  return result.rows;
}
