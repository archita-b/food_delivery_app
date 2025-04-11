import { wrapWithTryCatch } from "../middleware/utils.js";
import { assignDeliveryPartnerDB } from "../model/orders.js";
import redisClient from "../model/redis.js";
import { driversArray } from "../processLocationQueue.js";
import { calculateDistance } from "../utils.js/distance.js";
import { Node, Point, GeoSpatialQuadTree } from "../utils.js/driverQuadTree.js";

let driverQuadTree = null;

export const initializeDriverQuadTree = wrapWithTryCatch(
  async function initializeDriverQuadTree() {
    if (!driversArray.length) return driverQuadTree;

    const driverNodes = driversArray.map(
      ({ driverId, latitude, longitude }) => {
        return new Node(driverId, latitude, longitude);
      }
    );

    driverQuadTree = new GeoSpatialQuadTree(driverNodes);
    return driverQuadTree;
  }
);

export const updateDriverLocations = wrapWithTryCatch(
  async function updateDriverLocations(driverId, newLat, newLon) {
    if (!driverQuadTree) await initializeDriverQuadTree();

    let driverNode = driverQuadTree.items.get(driverId);

    if (!driverNode) {
      driverNode = new Node(driverId, newLat, newLon);
      driverQuadTree.insert(driverNode);
    } else {
      driverQuadTree.update(driverNode, newLat, newLon);
    }
  }
);

const nearestDeliveryPartner = wrapWithTryCatch(function nearestDeliveryPartner(
  orderLat,
  orderLon
) {
  const availablePartners = [...driversArray];

  if (availablePartners.length === 0) {
    throw new Error("No delivery partners available.");
  }

  const driverIds = new Set(
    availablePartners.map((partner) => partner.driverId)
  );

  const customerLocation = new Point(orderLat, orderLon);
  const nearestDrivers = driverQuadTree.findNearest(customerLocation);

  for (const driver of nearestDrivers) {
    if (driverIds.has(driver.driverId)) {
      return driver;
    }
  }
});

export const assignDeliveryPartner = wrapWithTryCatch(
  async function assignDeliveryPartner(orderId, orderLat, orderLong) {
    const nearestPartner = await nearestDeliveryPartner(orderLat, orderLong);

    if (!nearestPartner) {
      throw new Error("No delivery partner found.");
    }

    const partnerId = nearestPartner.partnerId;

    await redisClient.del(`driver:${partnerId}`);

    return await assignDeliveryPartnerDB(partnerId, orderId);
  }
);

// async function markPartnerAvailableAgain(partnerId, latitude, longitude) {
//   deliveryPartnersLocation[partnerId] = {
//     latitude,
//     longitude,
//     isAvailable: true,
//   };

//   await updateAvailabilityDB(partnerId, true);
// }
