import { wrapWithTryCatch } from "../middleware/utils.js";
import { assignDeliveryPartnerDB } from "../model/orders.js";
import redisClient from "../model/redis.js";
import { driversArray } from "../processLocationQueue.js";
import { calculateDistance } from "../utils.js/distance.js";
import { Node, Point, QuadTree } from "../utils.js/quadTree.js";

let driverQuadTree = null;

const buildDriverQuadTree = wrapWithTryCatch(function buildDriverQuadTree() {
  if (!driversArray.length) return driverQuadTree;

  const driverNodes = driversArray.map((element) => {
    const { latitude, longitude } = element;
    return new Node(element.driverId, latitude, longitude);
  });

  driverQuadTree = new QuadTree(driverNodes);
  return driverQuadTree;
});

export const updateDriverQuadTree = function () {
  buildDriverQuadTree();
  setInterval(buildDriverQuadTree, 5000);
};

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
