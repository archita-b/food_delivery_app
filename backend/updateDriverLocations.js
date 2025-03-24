import { wrapWithTryCatch } from "./middleware/utils.js";
import { getAvailableDeliveryPartners } from "./model/deliveryPartners.js";
import redisClient from "./model/redis.js";

const driversObject = {};
let driversArray = [];

function generateRandomLocation(baseLat, baseLon, radius = 0.01) {
  const lat = baseLat + (Math.random() - 0.5) * radius;
  const lon = baseLon + (Math.random() - 0.5) * radius;
  return { latitude: lat, longitude: lon };
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
      const location = generateRandomLocation(
        12.935208131107496,
        77.62405857232976
      );

      await redisClient.lPush(
        `queue`,
        JSON.stringify({ driverId, ...location })
      );
    }
  } catch (error) {
    console.log(`Error in updateDriverLocations function:`, error.message);
  }
}

async function processLocationQueue() {
  try {
    while (true) {
      const message = await redisClient.lPop("queue");

      if (!message) break;

      const { driverId, latitude, longitude } = JSON.parse(message);
      driversObject[driverId] = { latitude, longitude };
    }

    driversArray = Object.keys(driversObject).map((driverId) => {
      return {
        driverId: Number(driverId),
        latitude: driversObject[driverId].latitude,
        longitude: driversObject[driverId].longitude,
      };
    });
  } catch (error) {
    console.log(`Error in processLocationQueue function:`, error.message);
  }
}

setInterval(updateDriverLocations, 5000);
setInterval(processLocationQueue, 2000);

export { driversArray };
