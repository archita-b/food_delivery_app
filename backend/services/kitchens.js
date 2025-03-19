import { getKitchens, getOpenKitchensWithStock } from "../model/kitchens.js";
import { Node, Point, quadTree } from "../utils.js/quadTree.js";
import { wrapControllerWithTryCatch } from "../middleware/utils.js";

let kitchenQuadTree = null;

export const buildQuadTree = wrapControllerWithTryCatch(
  async function buildQuadTree() {
    const kitchens = await getKitchens();

    const latitudes = kitchens.map((kitchen) => kitchen.lat_long.x);
    const longitudes = kitchens.map((kitchen) => kitchen.lat_long.y);

    const topLeft = new Point(Math.max(...latitudes), Math.min(...longitudes));
    const bottomRight = new Point(
      Math.min(...latitudes),
      Math.max(...longitudes)
    );

    kitchenQuadTree = new quadTree(topLeft, bottomRight);

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

    kitchenQuadTree.insert(kitchenNodes);

    return kitchenQuadTree;
  }
);

export const findNearestKitchen = wrapControllerWithTryCatch(
  async function findNearestKitchen(latitude, longitude, items) {
    const kitchens = await getOpenKitchensWithStock(items);

    const kitchenIds = new Set(kitchens.map((kitchen) => kitchen.kitchen_id));

    const customerLocation = new Point(latitude, longitude);
    const nearestKitchens = kitchenQuadTree.findNearest(customerLocation);

    for (const kitchen of nearestKitchens) {
      if (availableKitchens.has(kitchen.id)) {
        return kitchen;
      }
    }
  }
);
