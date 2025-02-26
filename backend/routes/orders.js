import express from "express";

import { isLoggedIn } from "../middleware/auth.js";
import { cancelOrder, placeOrder } from "../controller/orders.js";

const router = express.Router();

router.post("/users/orders", isLoggedIn, placeOrder);
router.delete("/users/orders/:id", isLoggedIn, cancelOrder);

export default router;
