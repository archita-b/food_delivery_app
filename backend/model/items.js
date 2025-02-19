import pool from "./database.js";

export async function getItemsDB() {
  const result = await pool.query(`SELECT * FROM kitchens`);
  return result.rows;
}
