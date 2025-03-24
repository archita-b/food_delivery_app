import redisClient from "./model/redis.js";

const driversObject = {};
let driversArray = [];

async function processLocationQueue() {
  try {
    while (true) {
      const message = await redisClient.lPop("queue");

      if (!message) break;

      const parsedMessage = JSON.parse(message);
      if (parsedMessage.msgType === "locations") {
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
  } catch (error) {
    console.log(`Error in processLocationQueue function:`, error.message);
  }
}

setInterval(processLocationQueue, 8000);

export { driversArray };
