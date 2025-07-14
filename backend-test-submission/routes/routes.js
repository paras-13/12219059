import express from "express";
import {
  generateShortUrl,
  handleRedirect,
  fetchStats,
} from "../controllers/urlShortenerController.js";

const router = express.Router();

router.post("/shorturls", generateShortUrl);
router.get("/:shortCode", fetchStats);
router.get("/r/:shortCode", handleRedirect);

export default router;
