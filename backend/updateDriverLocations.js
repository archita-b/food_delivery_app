import { wrapWithTryCatch } from "./middleware/utils.js";
import { getAvailableDeliveryPartners } from "./model/deliveryPartners.js";
import redisClient from "./model/redis.js";

const driverLocations = {};

function generateRandomWalkLocation(
  driverId,
  baseLat,
  baseLon,
  stepSize = 0.0001
) {
  if (!driverLocations[driverId]) {
    driverLocations[driverId] = { latitude: baseLat, longitude: baseLon };
  }

  const deltaLat = (Math.random() - 0.5) * stepSize;
  const deltaLon = (Math.random() - 0.5) * stepSize;

  driverLocations[driverId].latitude += deltaLat;
  driverLocations[driverId].longitude += deltaLon;

  return {
    latitude: driverLocations[driverId].latitude,
    longitude: driverLocations[driverId].longitude,
  };
}

async function getDeliveryPartners() {
  try {
    const drivers = await getAvailableDeliveryPartners();
    return drivers.length ? drivers.map((driver) => driver.id) : [];
  } catch (error) {
    console.log(`Error in getDeliveryPartners function:`, error.message);
    return [];
  }
}

async function updateDriverLocations() {
  try {
    const driverIds = await getDeliveryPartners();

    if (!driverIds.length) return;

    for (const driverId of driverIds) {
      const location = generateRandomWalkLocation(
        driverId,
        12.935208131107496,
        77.62405857232976
      );

      await redisClient.lPush(
        `queue`,
        JSON.stringify({ msgType: "driverLocation", driverId, ...location })
      );
    }
  } catch (error) {
    console.log(`Error in updateDriverLocations function:`, error.message);
  }
}

setInterval(updateDriverLocations, 5000);
