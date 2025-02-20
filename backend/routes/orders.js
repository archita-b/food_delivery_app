import express from "express";

import { placeOrder } from "../controller/orders.js";

const router = express.Router();

router.post("/users/orders", placeOrder); // middleware will have customerId

export default router;
