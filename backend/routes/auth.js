import express from "express";

import { login, logout, registerUser } from "../controller/auth.js";
import { isLoggedIn } from "../middleware/auth.js";

const router = express.Router();

router.post("/users", registerUser);
router.post("/sessions", login);
router.delete("/sessions", isLoggedIn, logout);

export default router;
