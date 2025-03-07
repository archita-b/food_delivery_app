import { wrapControllerWithTryCatch } from "../middleware/utils.js";
import { updateAvailabilityDB } from "../model/deliveryPartners.js";
import { updateDeliveryPartnersLocationService } from "../services/deliveryPartners.js";

export const updateAvailability = wrapControllerWithTryCatch(
  async (req, res, next) => {
    const deliveryPartnerId = req.userId;

    const { isAvailable } = req.body;

    const response = await updateAvailabilityDB(deliveryPartnerId, isAvailable);

    res.status(200).json(response);
  }
);

export const updateDeliveryPartnersLocation = wrapControllerWithTryCatch(
  async function updateDeliveryPartnersLocation(req, res, next) {
    const partnerId = req.userId;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: "Missing location." });
    }

    updateDeliveryPartnersLocationService(partnerId, latitude, longitude);
    res
      .status(201)
      .json({ message: "Delivery partner's location updated successfully." });
  }
);
