import { wrapControllerWithTryCatch } from "../middleware/utils.js";
import { wrappedGetItemsDB } from "../model/items.js";

export const getItems = wrapControllerWithTryCatch(async (req, res, next) => {
  const menuItems = await wrappedGetItemsDB();
  res.status(200).json(menuItems);
});
