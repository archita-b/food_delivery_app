import express from "express";

import { getItems } from "../controller/items.js";

const router = express.Router();

router.get("/kitchens", getItems);

export default router;
