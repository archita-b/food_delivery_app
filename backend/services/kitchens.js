import { getKitchens, getOpenKitchensWithStock } from "../model/kitchens.js";
import { Node, Point, QuadTree } from "../utils.js/quadTree.js";
import { wrapWithTryCatch } from "../middleware/utils.js";

let kitchenQuadTree = null;

export const buildQuadTree = wrapWithTryCatch(async function buildQuadTree() {
  const kitchens = await getKitchens();

  const kitchenNodes = kitchens.map((kitchen) => {
    const { x: latitude, y: longitude } = kitchen.lat_long;
    return new Node(
      kitchen.id,
      latitude,
      longitude,
      kitchen.opening_time,
      kitchen.closing_time
    );
  });

  kitchenQuadTree = new QuadTree(kitchenNodes);

  return kitchenQuadTree;
});

export const findNearestKitchen = wrapWithTryCatch(
  async function findNearestKitchen(latitude, longitude, items) {
    const kitchens = await getOpenKitchensWithStock(items);

    const kitchenIds = new Set(kitchens.map((kitchen) => kitchen.kitchen_id));

    const customerLocation = new Point(latitude, longitude);
    const nearestKitchens = kitchenQuadTree.findNearest(customerLocation);

    for (const kitchen of nearestKitchens) {
      if (kitchenIds.has(kitchen.id)) {
        return kitchen;
      }
    }
  }
);
