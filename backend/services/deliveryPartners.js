import { wrapWithTryCatch } from "../middleware/utils.js";
import { assignDeliveryPartnerDB } from "../model/orders.js";
import redisClient from "../model/redis.js";
import { driversArray } from "../processLocationQueue.js";
import { calculateDistance } from "../utils.js/distance.js";

const nearestDeliveryPartner = wrapWithTryCatch(
  async function nearestDeliveryPartner(orderLat, orderLong) {
    const availablePartners = [...driversArray];

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
        nearestPartner = { partnerId: partner.driverId, distance };
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
