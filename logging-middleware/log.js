import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the project root
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Access token and URL from env
const token = process.env.AFFORDMED_ACCESS_TOKEN;
const URL = process.env.AFFORDMED_LOG_URL;

// Logging function
const Log = async (stack, level, pack, message) => {
  try {
    const response = await axios.post(
      URL,
      {
        stack,
        level,
        package: pack,
        message,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Log sent successfully:", response.data);
  } catch (err) {
    if (err.response) {
      console.error("Log failed with response:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
};
export default Log;
