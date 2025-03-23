import { getAvailableDeliveryPartners } from "./model/deliveryPartners.js";
import redisClient from "./model/redis.js";

function generateRandomLocation(baseLat, baseLon, radius = 0.01) {
  const lat = baseLat + (Math.random() - 0.5) * radius;
  const lon = baseLon + (Math.random() - 0.5) * radius;
  return { latitude: lat, longitude: lon };
}

async function getDeliveryPartners() {
  const drivers = await getAvailableDeliveryPartners();

  if (!drivers.length) {
    console.log("No available drivers found.");
    return;
  }

  return drivers.map((driver) => driver.id);
}

async function updateDriverLocations() {
  const driverIds = await getDeliveryPartners();

  for (const driverId of driverIds) {
    const location = generateRandomLocation(
      12.935208131107496,
      77.62405857232976
    );

    await redisClient.lPush(
      `locationQueue:${driverId}`,
      JSON.stringify({ ...location })
    );
  }

  // for (const driverId of driverIds) {
  //   const locations = await redisClient.lRange(
  //     `locationQueue:${driverId}`,
  //     0,
  //     -1
  //   );
  // console.log(`Driver ${driverId} locations:`, locations);
  // }
}

setInterval(updateDriverLocations, 5000);
