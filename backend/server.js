import express from "express";
import cookieParser from "cookie-parser";

import authRouter from "./routes/auth.js";
import itemsRouter from "./routes/items.js";
import ordersRouter from "./routes/orders.js";
import deliveryPartnersRouter from "./routes/deliveryPartners.js";
import { buildQuadTree } from "./services/kitchens.js";

const app = express();
const port = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());

app.use("/api", authRouter);
app.use("/api", itemsRouter);
app.use("/api", ordersRouter);
app.use("/api", deliveryPartnersRouter);

app.use((err, req, res, next) => {
  const errStatus = err.status || 500;
  const errMessage = err.message || "Internal Server Error";

  return res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMessage,
  });
});

app.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  await buildQuadTree();
});
