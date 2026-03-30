import {
  createLeaveRequest,
  findLeaveRequestById,
  listLeaveRequests,
  updateLeaveRequest,
} from "../dao/leaveRequest.dao.js";
import { findEmployeeProfileById } from "../dao/employeeProfile.dao.js";

const create = async ({ employee_id, leave_type, start_date, end_date, reason, status }) => {
  if (!employee_id || !leave_type || !start_date || !end_date) {
    const error = new Error("Employee id, leave type, start date, and end date are required.");
    error.status = 400;
    throw error;
  }

  if (new Date(start_date) > new Date(end_date)) {
    const error = new Error("Start date cannot be after end date.");
    error.status = 400;
    throw error;
  }

  const employee = await findEmployeeProfileById(employee_id);
  if (!employee) {
    const error = new Error("Employee profile not found.");
    error.status = 404;
    throw error;
  }

  return createLeaveRequest({
    employee_id,
    leave_type,
    start_date,
    end_date,
    reason: reason || null,
    status: status || "pending",
  });
};

const list = async ({ employee_id, status }) => listLeaveRequests({ employee_id, status });

const update = async (id, { status, approver_notes, approved_by }) => {
  if (!id) {
    const error = new Error("Leave request id is required.");
    error.status = 400;
    throw error;
  }

  const leaveRequest = await findLeaveRequestById(id);
  if (!leaveRequest) {
    const error = new Error("Leave request not found.");
    error.status = 404;
    throw error;
  }

  const nextStatus = status ?? leaveRequest.status;
  const approvalTimestamp = ["approved", "rejected"].includes(nextStatus)
    ? leaveRequest.approved_at || new Date()
    : null;

  await updateLeaveRequest(id, {
    status: nextStatus,
    approver_notes: approver_notes ?? leaveRequest.approver_notes,
    approved_by: approved_by ?? leaveRequest.approved_by,
    approved_at: approvalTimestamp,
  });

  return findLeaveRequestById(id);
};

export { create, list, update };
