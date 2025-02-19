import express from "express";

import itemsRouter from "./routes/items.js";

const app = express();
const port = process.env.PORT || 5000;

app.use("/api", itemsRouter);

app.use((err, req, res, next) => {
  const errStatus = err.status || 500;
  const errMessage = err.message || "Internal Server Error";

  return res.status(errStatus).json({
    success: false,
    status: errStatus,
    message: errMessage,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
