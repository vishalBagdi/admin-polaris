import express from "express";
import { create, list, update } from "../controllers/role.controller.js";
import { requireAuthAndRole } from "../config/auth.js";

const router = express.Router();

router.get("/", requireAuthAndRole(["admin"]), list);
router.put("/:id", requireAuthAndRole(["admin"]), update);

export default router;
