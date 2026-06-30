import express from "express";
import rateLimit from "express-rate-limit";
const app = express();
app.use(rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests" }
}));
app.get("/", (req, res) => res.json({ok: true}));
app.listen(3001, async () => {
  console.log(await (await fetch("http://localhost:3001")).json());
  const r = await fetch("http://localhost:3001");
  console.log(r.status, r.headers.get("content-type"));
  process.exit(0);
});
