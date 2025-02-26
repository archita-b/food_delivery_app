import bcrypt from "bcrypt";

import { getuser, registerUserDB } from "../model/users.js";

export async function registerUser(req, res, next) {
  try {
    const { userName, password, fullName, address, latLong, phone } = req.body;

    if (!userName || !password || !address || !latLong || !phone) {
      return res.status(400).json({ error: "All fields are required." });
    }

    const existingUser = await getuser(userName);

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
