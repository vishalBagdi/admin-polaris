import express from "express";
import { requireAuthAndRole } from "../config/auth.js";
import { create, get, list, remove, update } from "../controllers/subcategory.controller.js";
import { subcategoryUpload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.get("/", requireAuthAndRole(["admin", "hr"]), list);
router.get("/:id", requireAuthAndRole(["admin", "hr"]), get);
router.post("/create", requireAuthAndRole(["admin", "hr"]), subcategoryUpload, create);
router.put("/:id", requireAuthAndRole(["admin", "hr"]), subcategoryUpload, update);
router.delete("/:id", requireAuthAndRole(["admin", "hr"]), remove);

export default router;
