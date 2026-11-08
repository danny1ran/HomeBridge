import "dotenv/config";
import { createApp } from "./app.js";
const { SUPABASE_URL: url, SUPABASE_ANON_KEY: key } = process.env;
if (!url || !key) {
  console.error(
    "Backend setup required: set SUPABASE_URL and SUPABASE_ANON_KEY in .env. See README.md.",
  );
  process.exit(1);
}
const origins = (
  process.env.FRONTEND_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((v) => v.trim());
createApp({ url, key, origins }).listen(Number(process.env.PORT || 3001), () =>
  console.log("HomeBridge API ready"),
);
