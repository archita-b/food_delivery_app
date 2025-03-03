import { wrapControllerWithTryCatch } from "./utils.js";
import { getSession, checkUserExists } from "../model/users.js";

export const isLoggedIn = wrapControllerWithTryCatch(async (req, res, next) => {
  const { sessionId } = req.cookies;
  const activeSession = await getSession(sessionId);

  if (!sessionId || !activeSession) {
    return res.status(401).json({ error: "Invalid session." });
  }

  const doesUserExist = await checkUserExists(activeSession.user_id);
  if (!doesUserExist) {
    return res.status(403).json({ error: "User does not exist." });
  }

  req.userId = activeSession.user_id;
  req.sessionId = sessionId;

  next();
});
