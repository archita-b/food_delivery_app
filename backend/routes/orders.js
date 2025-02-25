import express from "express";

import { cancelOrder, placeOrder } from "../controller/orders.js";

const router = express.Router();

router.post("/users/orders", placeOrder); // middleware will have customerId
router.delete("/users/orders/:id", cancelOrder);

export default router;
