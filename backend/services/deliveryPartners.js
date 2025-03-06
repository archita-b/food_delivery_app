import { updateAvailabilityDB } from "../model/deliveryPartners.js";
import { calculateDistance } from "../utils.js/distance.js";

const deliveryPartnersLocation = {};

function updateDeliveryPartnersLocation(partnerId, latitude, longitude) {
  if (!partnerId || !latitude || !longitude) {
    throw new Error("Invalid location update parameters.");
  }

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

async function assignDeliveryPartner(orderId, orderLat, orderLong) {
  const nearestPartner = nearestDeliveryPartner(orderLat, orderLong);

  if (!nearestPartner) {
    throw new Error("No delivery partner found.");
  }

  const partnerId = nearestPartner.partnerId;

  delete deliveryPartnersLocation[partnerId];

  await updateAvailabilityDB(partnerId, false);

  return { orderId, deliveryPartner: partnerId };
}

async function markPartnerAvailableAgain(partnerId, latitude, longitude) {
  deliveryPartnersLocation[partnerId] = {
    latitude,
    longitude,
    isAvailable: true,
  };

  await updateAvailabilityDB(partnerId, true);
}

// updateDeliveryPartnersLocation(1, 12.97, 77.59);
// updateDeliveryPartnersLocation(2, 12.95, 77.56);
// updateDeliveryPartnersLocation(3, 12.98, 77.6);

// getAvailableDeliveryPartners();
