import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const PORT = Number(process.env.PORT ?? 4000);
const JWT_SECRET = process.env.REALTIME_JWT_SECRET;
const API_KEY = process.env.REALTIME_API_KEY;

if (!JWT_SECRET) throw new Error("REALTIME_JWT_SECRET is not set");
if (!API_KEY) throw new Error("REALTIME_API_KEY is not set");

// Supports exact origins ("https://e-mall.uz") and single-level wildcards
// ("https://*.e-mall.uz") so every store subdomain can connect directly.
const ALLOWED_ORIGIN_PATTERNS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:3000")
  .split(",")
  .map((raw) => raw.trim())
  .filter(Boolean)
  .map((pattern) => {
    if (!pattern.includes("*")) return pattern;
    const escaped = pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace("\\*", "[^.]+");
    return new RegExp(`^${escaped}$`);
  });

function isOriginAllowed(origin: string) {
  return ALLOWED_ORIGIN_PATTERNS.some((pattern) =>
    typeof pattern === "string" ? pattern === origin : pattern.test(origin)
  );
}

const corsOriginCheck = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
  if (!origin || isOriginAllowed(origin)) callback(null, true);
  else callback(new Error("Not allowed by CORS"));
};

interface RealtimeTokenPayload {
  storeId: string;
  userId: string;
  role: string;
}

const app = express();
app.use(cors({ origin: corsOriginCheck }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Called server-to-server by the Next.js app (Vercel) after a Sale/Order/stock
// change is persisted, to broadcast the event to everyone in that store's room.
app.post("/broadcast", (req, res) => {
  const apiKey = req.header("x-api-key");
  if (apiKey !== API_KEY) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const { storeId, event, payload } = req.body ?? {};
  if (typeof storeId !== "string" || typeof event !== "string") {
    res.status(400).json({ error: "storeId and event are required" });
    return;
  }

  io.to(`store:${storeId}`).emit(event, payload ?? null);
  res.json({ ok: true });
});

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: corsOriginCheck },
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string") {
    next(new Error("missing token"));
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET as string) as RealtimeTokenPayload;
    socket.data.storeId = decoded.storeId;
    socket.data.userId = decoded.userId;
    socket.data.role = decoded.role;
    next();
  } catch {
    next(new Error("invalid token"));
  }
});

io.on("connection", (socket) => {
  const { storeId } = socket.data as RealtimeTokenPayload;
  socket.join(`store:${storeId}`);

  socket.on("disconnect", () => {
    // no-op: socket.io cleans up room membership automatically
  });
});

httpServer.listen(PORT, () => {
  console.log(`realtime-server listening on :${PORT}`);
});
