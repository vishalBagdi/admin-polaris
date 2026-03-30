import express from "express";
import { requireAuth, requireAuthAndRole } from "../config/auth.js";
import { employeeDocumentUpload, employeeUpload } from "../middlewares/upload.middleware.js";
import {
  create as createEmployeeProfile,
  getById as getEmployeeProfileById,
  list as listEmployeeProfiles,
  remove as removeEmployeeProfile,
  update as updateEmployeeProfile,
} from "../controllers/employeeProfile.controller.js";
import {
  create as createAttendance,
  list as listAttendance,
  listLogs as listAttendanceLogs,
  update as updateAttendance,
} from "../controllers/attendance.controller.js";
import { create as createSalary, list as listSalary, update as updateSalary } from "../controllers/salary.controller.js";
import {
  create as createLeaveRequest,
  list as listLeaveRequests,
  update as updateLeaveRequest,
} from "../controllers/leaveRequest.controller.js";
import {
  create as createEmployeeDocument,
  list as listEmployeeDocuments,
  remove as removeEmployeeDocument,
  update as updateEmployeeDocument,
} from "../controllers/employeeDocument.controller.js";

const router = express.Router();

router.get("/employees", listEmployeeProfiles);

router.use(requireAuthAndRole(["admin", "hr"]));

router.post("/employees", employeeUpload, createEmployeeProfile);
router.get("/employees/:id", getEmployeeProfileById);
router.put("/employees/:id", employeeUpload, updateEmployeeProfile);
router.delete("/employees/:id", removeEmployeeProfile);
router.post("/employees/:employee_id/documents", employeeDocumentUpload, createEmployeeDocument);
router.get("/employees/:employee_id/documents", listEmployeeDocuments);
router.put("/documents/:id", employeeDocumentUpload, updateEmployeeDocument);
router.delete("/documents/:id", removeEmployeeDocument);

router.post("/attendance", createAttendance);
router.get("/attendance", listAttendance);
router.get("/attendance/logs", listAttendanceLogs);
router.put("/attendance/:id", updateAttendance);

router.post("/salaries", createSalary);
router.get("/salaries", listSalary);
router.put("/salaries/:id", updateSalary);

router.post("/leaves", createLeaveRequest);
router.get("/leaves", listLeaveRequests);
router.put("/leaves/:id", updateLeaveRequest);

export default router;
