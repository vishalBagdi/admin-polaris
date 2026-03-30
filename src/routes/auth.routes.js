import express from "express";
import { changePassword, forgotPassword, login, register } from "../controllers/auth.controller.js";

const router = express.Router();

router.get("/login", (_req, res) => {
  return res.status(405).json({
    message: "Use POST /api/v1/auth/login with email and password.",
  });
});
router.post("/login", login);
router.post("/register", register);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", changePassword);

export default router;
