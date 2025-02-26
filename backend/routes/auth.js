import express from "express";

import { registerUser } from "../controller/auth.js";

const router = express.Router();

router.post("/users", registerUser);

export default router;
