import { wrapWithTryCatch } from "../middleware/utils.js";
import { assignDeliveryPartnerDB } from "../model/orders.js";
import redisClient from "../model/redis.js";
import { calculateDistance } from "../utils.js/distance.js";

const getAvailableDeliveryPartners = wrapWithTryCatch(
  async function getAvailableDeliveryPartners() {
    const keys = await redisClient.keys("locationQueue:*");

    if (!keys.length) return [];

    const partners = [];

    for (const key of keys) {
      const driverId = key.split(":")[1];
      const latestLocation = await redisClient.lIndex(key, 0);

      if (latestLocation) {
        const parsedLocation = JSON.parse(latestLocation);
        partners.push({
          id: Number(driverId),
          latitude: parsedLocation.latitude,
          longitude: parsedLocation.longitude,
        });
      }
    }
    return partners;
  }
);

const nearestDeliveryPartner = wrapWithTryCatch(
  async function nearestDeliveryPartner(orderLat, orderLong) {
    const availablePartners = await getAvailableDeliveryPartners();

    if (availablePartners.length === 0) {
      throw new Error("No delivery partners available.");
    }

    let nearestPartner = null;
    for (const partner of availablePartners) {
      const distance = calculateDistance(
        orderLat,
        orderLong,
        partner.latitude,
        partner.longitude
      );

      if (!nearestPartner || distance < nearestPartner.distance) {
        nearestPartner = { partnerId: partner.id, distance };
      }
    }
    return nearestPartner;
  }
);

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
