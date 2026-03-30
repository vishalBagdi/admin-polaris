import express from "express";
import path from "path";
import { sequelize } from "./models/index.js";

import authRoutes from "./routes/auth.routes.js";
import rolesRoutes from "./routes/roles.routes.js";
import usersRoutes from "./routes/users.routes.js";
import hrRoutes from "./routes/hr.routes.js";
import attendanceImportRoutes from "./routes/attendanceImport.routes.js";
import categoriesRoutes from "./routes/categories.routes.js";
import subcategoriesRoutes from "./routes/subcategories.routes.js";
import { remove as removeUser } from "./controllers/user.controller.js";
import { requireAuthAndRole } from "./config/auth.js";

const app = express();
const API_PREFIX = "/api/v1";

app.use((req, res, next) => {
  const originEnv = [process.env.CORS_ORIGIN, process.env.FRONTEND_BASE_URL].filter(Boolean).join(",");
  const allowedOrigins = (
    originEnv || ""
  )
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const requestOrigin = req.headers.origin;
  const hasOrigin = typeof requestOrigin === "string" && requestOrigin.length > 0;
  const isAllowed = !hasOrigin || allowedOrigins.includes(requestOrigin);

  if (!isAllowed) {
    return res.status(403).json({ message: "Origin not allowed by CORS policy." });
  }

  const origin = hasOrigin ? requestOrigin : allowedOrigins[0];

  res.header("Access-Control-Allow-Origin", origin);
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/storage", express.static(path.join(process.cwd(), "storage")));
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
app.get("/api/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// Canonical backend API routes.
app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/roles`, rolesRoutes);
app.use(`${API_PREFIX}/users`, usersRoutes);
app.use(`${API_PREFIX}/categories`, categoriesRoutes);
app.use(`${API_PREFIX}/subcategories`, subcategoriesRoutes);
app.use(`${API_PREFIX}/subcategory`, subcategoriesRoutes);
app.use(`${API_PREFIX}/hr`, hrRoutes);
app.use(`${API_PREFIX}/attendance`, attendanceImportRoutes);

app.delete(`${API_PREFIX}/users/:id`, requireAuthAndRole(["admin"]), removeUser);

app.use((req, res) => {
  res.status(404).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

app.use((error, _req, res, _next) => {
  console.error("Unhandled API error:", error);
  const status = error?.status || 500;
  const message = error?.status ? error.message : "Internal server error.";
  return res.status(status).json({ message });
});

export default app;
