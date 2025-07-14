// backend/app.js
import express from "express";
import dotenv from "dotenv";
import Log from "../logging-middleware/log.js";
import urlRoutes from "./routes/routes.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use("/", urlRoutes);
Log("backend", "info", "handler", "Testing loggin middleware functionality");

app.listen(PORT, () => {
  console.log(`🚀 Server running on PORT ${PORT}`);
});
