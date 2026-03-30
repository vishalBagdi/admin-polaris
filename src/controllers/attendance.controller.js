import {
  create as createAttendance,
  list as listAttendance,
  listEditLogs as listAttendanceEditLogs,
  update as updateAttendance,
} from "../services/attendance.service.js";

const create = async (req, res) => {
  try {
    const result = await createAttendance(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Attendance creation failed.";
    return res.status(status).json({ message });
  }
};

const list = async (req, res) => {
  try {
    const result = await listAttendance(req.query || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch attendance records.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const result = await updateAttendance(req.params.id, req.body || {}, req.user || null);
    return res.status(200).json({ data: result });
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Attendance update failed.";
    return res.status(status).json({ message });
  }
};

const listLogs = async (req, res) => {
  try {
    const result = await listAttendanceEditLogs(req.query || {});
    return res.status(200).json({ data: result });
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch attendance audit logs.";
    return res.status(status).json({ message });
  }
};

export { create, list, listLogs, update };
