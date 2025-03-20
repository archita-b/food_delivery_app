import { assignDeliveryPartnerDB } from "../model/orders.js";
import redisClient from "../model/redis.js";
import { calculateDistance } from "../utils.js/distance.js";

async function getAvailableDeliveryPartners() {
  const keys = await redisClient.keys(`driver:*`);
  if (!keys.length) return [];

  const partners = [];
  for (const key of keys) {
    const partner = JSON.parse(await redisClient.get(key));
    const partnerId = Number(key.split(":")[1]);
    partners.push({
      id: partnerId,
      latitude: partner.latitude,
      longitude: partner.longitude,
    });
  }
  return partners;
}

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

export async function assignDeliveryPartner(orderId, orderLat, orderLong) {
  const nearestPartner = await nearestDeliveryPartner(orderLat, orderLong);

  if (!nearestPartner) {
    throw new Error("No delivery partner found.");
  }

  const partnerId = nearestPartner.partnerId;

  await redisClient.del(`driver:${partnerId}`);

  return await assignDeliveryPartnerDB(partnerId, orderId);
}

// async function markPartnerAvailableAgain(partnerId, latitude, longitude) {
//   deliveryPartnersLocation[partnerId] = {
//     latitude,
//     longitude,
//     isAvailable: true,
//   };

//   await updateAvailabilityDB(partnerId, true);
// }
