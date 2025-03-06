import { wrapControllerWithTryCatch } from "../middleware/utils.js";
import { updateAvailabilityDB } from "../model/deliveryPartners.js";

export const updateAvailability = wrapControllerWithTryCatch(
  async (req, res, next) => {
    const deliveryPartnerId = req.userId;

    const { isAvailable } = req.body;

    const response = await updateAvailabilityDB(deliveryPartnerId, isAvailable);

    res.status(200).json(response);
  }
);
