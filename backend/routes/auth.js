import express from "express";

import { login, registerUser } from "../controller/auth.js";

const router = express.Router();

router.post("/users", registerUser);
router.post("/sessions", login);

export default router;
