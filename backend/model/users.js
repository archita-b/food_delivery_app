import pool from "./database.js";
import { wrapInTransaction } from "../middleware/utils.js";

export const getUser = wrapInTransaction(async function getUser(userName) {
  const result = await pool.query("SELECT * FROM auth WHERE username = $1", [
    userName,
  ]);
  return result.rows[0];
});

export const registerUserDB = wrapInTransaction(async function registerUserDB(
  userName,
  password,
  fullName,
  address,
  latLong,
  phone
) {
  const authResult = await pool.query(
    `INSERT INTO auth (username, password) 
            VALUES ($1, $2) RETURNING *`,
    [userName, password]
  );

  const customerResult = await pool.query(
    `INSERT INTO customers (id, full_name, address, lat_long, phone) 
            VALUES ($1, $2, $3, POINT($4, $5), $6) RETURNING *`,
    [
      authResult.rows[0].user_id,
      fullName,
      address,
      latLong[0],
      latLong[1],
      phone,
    ]
  );

  return {
    user_id: authResult.rows[0].user_id,
    userName: authResult.rows[0].username,
    fullName: customerResult.rows[0].full_name,
    address: customerResult.rows[0].address,
    phone: customerResult.rows[0].phone,
  };
});

export const createSession = wrapInTransaction(async function createSession(
  userId
) {
  const result = await pool.query(
    "INSERT INTO sessions (user_id) VALUES ($1) RETURNING session_id",
    [userId]
  );
  return result.rows[0].session_id;
});

export const getSession = wrapInTransaction(async function getSession(
  sessionId
) {
  const result = await pool.query(
    "SELECT * FROM sessions WHERE session_id = $1",
    [sessionId]
  );
  return result.rows[0];
});

export const deleteSession = wrapInTransaction(async function deleteSession(
  sessionId
) {
  await pool.query("DELETE FROM sessions WHERE session_id = $1", [sessionId]);
});

export const checkUserExists = wrapInTransaction(async function checkUserExists(
  id
) {
  const result = await pool.query("SELECT id FROM customers WHERE id = $1", [
    id,
  ]);
  return result.rowCount > 0;
});
