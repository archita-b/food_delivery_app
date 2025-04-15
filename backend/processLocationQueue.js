import redisClient from "./model/redis.js";
import { updateDriverLocations } from "./services/deliveryPartners.js";

const driversObject = {};
let driversArray = [];

export async function processLocationQueue() {
  try {
    while (true) {
      const message = await redisClient.lPop("queue");

      if (!message) break;

      const parsedMessage = JSON.parse(message);
      if (parsedMessage.msgType === "driverLocation") {
        const { driverId, latitude, longitude } = parsedMessage;
        driversObject[driverId] = { latitude, longitude };
      }
    }

    driversArray = Object.keys(driversObject).map((driverId) => {
      return {
        driverId: Number(driverId),
        latitude: driversObject[driverId].latitude,
        longitude: driversObject[driverId].longitude,
      };
    });

    for (const { driverId, latitude, longitude } of driversArray) {
      await updateDriverLocations(driverId, latitude, longitude);
    }
  } catch (error) {
    console.log(`Error in processLocationQueue function:`, error.message);
  }
}

setInterval(async () => {
  await processLocationQueue();
}, 1000);

export { driversArray };
