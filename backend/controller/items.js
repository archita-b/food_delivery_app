import { wrapControllerWithTryCatch } from "../middleware/utils.js";
import { getItemsDB } from "../model/items.js";

export const getItems = wrapControllerWithTryCatch(async (req, res, next) => {
  const menuItems = await getItemsDB();
  res.status(200).json(menuItems);
});
