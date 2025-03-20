import { getAvailableDeliveryPartners } from "./model/deliveryPartners.js";
import redisClient from "./model/redis.js";

function generateRandomLocation(baseLat, baseLon, radius = 0.01) {
  const lat = baseLat + (Math.random() - 0.5) * radius;
  const lon = baseLon + (Math.random() - 0.5) * radius;
  return { latitude: lat, longitude: lon };
}

async function updateDriverLocations() {
  const drivers = await getAvailableDeliveryPartners();

  const driverIDs = drivers.map((driver) => driver.id);

  if (!drivers.length) {
    console.log("No available drivers found.");
    return;
  }

  setInterval(async () => {
    for (const driverID of driverIDs) {
      const location = generateRandomLocation(
        12.935208131107496,
        77.62405857232976
      );
      await redisClient.set(
        `driver:${driverID}`,
        JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        })
      );
    }
  }, 5000);
}

(async () => {
  await updateDriverLocations();
})();
