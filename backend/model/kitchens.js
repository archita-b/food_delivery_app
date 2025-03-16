import { Node, Point, quadTree } from "../utils.js/quadTree.js";
import pool from "./database.js";

export let kitchenQuadTree = null;

export async function buildQuadTree() {
  const kitchensResult = await pool.query(
    `SELECT id, lat_long, opening_time, closing_time FROM kitchens`
  );

  if (!kitchensResult.rows.length) {
    throw new Error("No kitchens found.");
  }

  const latitudes = kitchensResult.rows.map((row) => row.lat_long.x);
  const longitudes = kitchensResult.rows.map((row) => row.lat_long.y);

  const topLeft = new Point(Math.max(...latitudes), Math.min(...longitudes));
  const bottomRight = new Point(
    Math.min(...latitudes),
    Math.max(...longitudes)
  );

  kitchenQuadTree = new quadTree(topLeft, bottomRight);

  for (const kitchen of kitchensResult.rows) {
    const { x: latitude, y: longitude } = kitchen.lat_long;

    const node = new Node(
      kitchen.id,
      latitude,
      longitude,
      kitchen.opening_time,
      kitchen.closing_time
    );

    kitchenQuadTree.insert(node);
  }
  return kitchenQuadTree;
}
