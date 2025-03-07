import { updateAvailabilityDB } from "../model/deliveryPartners.js";
import { assignDeliveryPartnerDB } from "../model/orders.js";
import { calculateDistance } from "../utils.js/distance.js";

const deliveryPartnersLocation = {
  4: { latitude: 12.97, longitude: 77.59, isAvailable: true },
  5: { latitude: 12.95, longitude: 77.56, isAvailable: true },
  6: { latitude: 12.98, longitude: 77.6, isAvailable: true },
};

export function updateDeliveryPartnersLocationService(
  partnerId,
  latitude,
  longitude
) {
  if (!deliveryPartnersLocation[partnerId]) {
    deliveryPartnersLocation[partnerId] = {
      latitude,
      longitude,
      isAvailable: true,
    };
  } else {
    deliveryPartnersLocation[partnerId].latitude = latitude;
    deliveryPartnersLocation[partnerId].longitude = longitude;
  }
}

function getAvailableDeliveryPartners() {
  return Object.entries(deliveryPartnersLocation).map(
    ([partnerId, partnerLocation]) => {
      return { id: partnerId, ...partnerLocation };
    }
  );
}

function nearestDeliveryPartner(orderLat, orderLong) {
  const availablePartners = getAvailableDeliveryPartners();

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
  const nearestPartner = nearestDeliveryPartner(orderLat, orderLong);

  if (!nearestPartner) {
    throw new Error("No delivery partner found.");
  }

  const partnerId = nearestPartner.partnerId;

  delete deliveryPartnersLocation[partnerId];

  return await assignDeliveryPartnerDB(partnerId, orderId);
}

async function markPartnerAvailableAgain(partnerId, latitude, longitude) {
  deliveryPartnersLocation[partnerId] = {
    latitude,
    longitude,
    isAvailable: true,
  };

  await updateAvailabilityDB(partnerId, true);
}
