import {
  create as createLeaveRequest,
  list as listLeaveRequests,
  update as updateLeaveRequest,
} from "../services/leaveRequest.service.js";

const create = async (req, res) => {
  try {
    const result = await createLeaveRequest(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Leave request creation failed.";
    return res.status(status).json({ message });
  }
};

const list = async (req, res) => {
  try {
    const result = await listLeaveRequests(req.query || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch leave requests.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const result = await updateLeaveRequest(req.params.id, req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Leave request update failed.";
    return res.status(status).json({ message });
  }
};

export { create, list, update };
