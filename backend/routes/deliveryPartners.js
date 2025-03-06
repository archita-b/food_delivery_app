import express from "express";

import { isLoggedIn } from "../middleware/auth.js";
import { updateAvailability } from "../controller/deliveryPartners.js";

const router = express.Router();

router.patch("/deliveryPartners", isLoggedIn, updateAvailability);

export default router;
