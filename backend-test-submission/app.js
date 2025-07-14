// backend/app.js

import express from "express";
import dotenv from "dotenv";
import Log from "../logging-middleware/log.js";
dotenv.config(); // will load .env from root

const app = express();
const PORT = process.env.PORT || 8000;

Log("backend", "info", "handler", "Testing loggin middleware functionality");

app.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
});
