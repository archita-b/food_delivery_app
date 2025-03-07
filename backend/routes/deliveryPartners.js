import express from "express";

import { isLoggedIn } from "../middleware/auth.js";
import {
  updateAvailability,
  updateDeliveryPartnersLocation,
} from "../controller/deliveryPartners.js";

const router = express.Router();

router.post("/deliveryPartners", isLoggedIn, updateDeliveryPartnersLocation);
router.patch("/deliveryPartners", isLoggedIn, updateAvailability);

export default router;
