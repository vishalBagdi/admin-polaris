import { LeaveRequest } from "../models/index.js";

const createLeaveRequest = async (payload) => LeaveRequest.create(payload);
const updateLeaveRequest = async (id, payload) => LeaveRequest.update(payload, { where: { id } });
const findLeaveRequestById = async (id) => LeaveRequest.findByPk(id);
const listLeaveRequests = async ({ employee_id, status }) => {
  const where = {};

  if (employee_id) {
    where.employee_id = employee_id;
  }

  if (status) {
    where.status = status;
  }

  return LeaveRequest.findAll({ where, order: [["created_at", "DESC"]] });
};

export { createLeaveRequest, updateLeaveRequest, findLeaveRequestById, listLeaveRequests };
