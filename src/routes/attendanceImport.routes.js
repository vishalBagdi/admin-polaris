import express from "express";
import { importLogs } from "../controllers/attendanceImport.controller.js";

const router = express.Router();

router.post("/import", importLogs);

export default router;
