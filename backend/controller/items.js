import { getItemsDB } from "../model/items.js";

export async function getItems(req, res, next) {
  try {
    const menuItems = await getItemsDB();
    res.status(200).json(menuItems);
  } catch (error) {
    console.log("Error in getItems controller: ", error.message);
    next(error);
  }
}
