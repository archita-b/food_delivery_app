import { checkUserExists, getSession } from "../model/users.js";

export async function isLoggedIn(req, res, next) {
  try {
    const { sessionId } = req.cookies;
    const activeSession = await getSession(sessionId);

    if (!sessionId || !activeSession) {
      return res.status(401).json({ error: "Invalid session." });
    }

    const doesUserExist = await checkUserExists(activeSession.userId);
    if (!doesUserExist) {
      return res.status(403).json({ error: "User does not exist." });
    }

    req.userId = activeSession.userId;
    req.sessionId = sessionId;

    next();
  } catch (error) {
    console.log("Error in auth middleware:", error.message);
    next(error);
  }
}
