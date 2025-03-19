import pool from "../model/database.js";

export function wrapControllerWithTryCatch(fn) {
  return async function (req, res, next) {
    try {
      return await fn(req, res, next);
    } catch (error) {
      console.log(`Error in ${fn.name} function: `, error.message);
      next(error);
    }
  };
}

export function wrapInTransaction(fn) {
  return async function (...args) {
    try {
      await pool.query("BEGIN");
      const result = await fn(...args);
      await pool.query("COMMIT");
      return result;
    } catch (error) {
      await pool.query("ROLLBACK");
      throw error;
    }
  };
}
