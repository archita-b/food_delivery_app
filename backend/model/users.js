import pool from "./database.js";

export async function getUser(userName) {
  const result = await pool.query("SELECT * FROM auth WHERE username = $1", [
    userName,
  ]);
  return result.rows[0];
}

export async function registerUserDB(
  userName,
  password,
  fullName,
  address,
  latLong,
  phone
) {
  await pool.query("BEGIN");

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

  await pool.query("COMMIT");

  return {
    user_id: authResult.rows[0].user_id,
    userName: authResult.rows[0].username,
    fullName: customerResult.rows[0].full_name,
    address: customerResult.rows[0].address,
    phone: customerResult.rows[0].phone,
  };
}

export async function createSession(userId) {
  const result = await pool.query(
    "INSERT INTO sessions (user_id) VALUES ($1) RETURNING session_id",
    [userId]
  );
  return result.rows[0].session_id;
}
