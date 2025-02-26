import bcrypt from "bcrypt";

import { createSession, getUser, registerUserDB } from "../model/users.js";

export async function registerUser(req, res, next) {
  try {
    const { userName, password, fullName, address, latLong, phone } = req.body;

    if (!userName || !password || !address || !latLong || !phone) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await getUser(userName);

    if (existingUser) {
      return res.status(422).json({ error: "Username already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userDetails = await registerUserDB(
      userName,
      hashedPassword,
      fullName,
      address,
      latLong,
      phone
    );

    res.status(201).json(userDetails);
  } catch (error) {
    console.log("Error in registerUser controller:", error.message);
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const { userName, password } = req.body;

    const user = await getUser(userName);
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!user || !isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const sessionId = await createSession(user.user_id);

    res
      .cookie("sessionId", sessionId, {
        maxAge: 24 * 60 * 60 * 1000,
        httpOnly: true,
      })
      .status(201)
      .json({
        message: "User logged in successfully.",
      });
  } catch (error) {
    console.log("Error in login controller:", error.message);
    next(error);
  }
}
