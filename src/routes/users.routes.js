import express from "express";
import { create, get, list, remove, update } from "../controllers/user.controller.js";
import { requireAuthAndRole } from "../config/auth.js";
import { userProfileUpload } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/create", requireAuthAndRole(["admin"]), userProfileUpload, create);
router.get("/", list);
router.get("/:id", requireAuthAndRole(["admin"]), get);
router.delete("/delete/:id", requireAuthAndRole(["admin"]), remove);
router.put("/:id", requireAuthAndRole(["admin"]), userProfileUpload, update);

export default router;
