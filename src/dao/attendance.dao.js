import { fn, literal, Op, col } from "sequelize";
import { Attendance, AttendanceEditLog, EmployeeProfile, User } from "../models/index.js";

const createAttendance = async (payload) => Attendance.create(payload);
const bulkCreateAttendances = async (payloads) =>
  Attendance.bulkCreate(payloads, {
    returning: true,
    ignoreDuplicates: true,
  });
const updateAttendance = async (id, payload) => Attendance.update(payload, { where: { id } });
const updateAttendancesByCodeAndDate = async ({ code, attendance_date }, payload) =>
  Attendance.update(payload, { where: { code, attendance_date } });
const createAttendanceEditLog = async (payload) => AttendanceEditLog.create(payload);
const attendanceInclude = [
  {
    model: EmployeeProfile,
    as: "employee_profile",
    attributes: ["id", "code", "full_name", "department", "designation", "photo"],
  },
];
const attendanceEditLogInclude = [
  {
    model: User,
    as: "updated_by_user",
    attributes: ["id", "name", "email"],
  },
];

const findAttendanceById = async (id) => Attendance.findByPk(id, { include: attendanceInclude });
const findAttendancesByCodeAndDate = async ({ code, attendance_date }) =>
  Attendance.findAll({
    where: { code, attendance_date },
    include: attendanceInclude,
    order: [
      ["punch_time", "ASC"],
      ["id", "ASC"],
    ],
  });
const listAttendanceEditLogs = async ({ code, attendance_date, attendance_id, limit = 50 }) => {
  const where = {};
  if (code) where.code = code;
  if (attendance_date) where.attendance_date = attendance_date;
  if (attendance_id) where.attendance_id = attendance_id;

  return AttendanceEditLog.findAll({
    where,
    include: attendanceEditLogInclude,
    order: [["created_at", "DESC"], ["id", "DESC"]],
    limit,
  });
};
const findAttendancesForImport = async ({ codes, attendanceDates }) =>
  Attendance.findAll({
    where: {
      code: { [Op.in]: codes },
      attendance_date: { [Op.in]: attendanceDates },
    },
    attributes: ["code", "attendance_date", "punch_time"],
  });

const listAttendances = async ({ code, from_date, to_date, status, page, limit }) => {
  const where = {};

  if (code) {
    where.code = code;
  }
  if (status) {
    where.status = status;
  }

  if (from_date || to_date) {
    where.attendance_date = {};
    if (from_date) {
      where.attendance_date[Op.gte] = from_date;
    }
    if (to_date) {
      where.attendance_date[Op.lte] = to_date;
    }
  }

  const order = [
    ["attendance_date", "DESC"],
    ["punch_time", "DESC"],
    ["id", "DESC"],
  ];
  const include = attendanceInclude;

  if (Number.isFinite(page) && Number.isFinite(limit)) {
    const offset = (page - 1) * limit;
    return Attendance.findAndCountAll({
      where,
      include,
      order,
      limit,
      offset,
    });
  }

  return Attendance.findAll({
    where,
    include,
    order,
  });
};

const listAttendanceSummary = async ({ code, from_date, to_date }) => {
  const where = {};

  if (code) {
    where.code = code;
  }

  if (from_date || to_date) {
    where.attendance_date = {};
    if (from_date) {
      where.attendance_date[Op.gte] = from_date;
    }
    if (to_date) {
      where.attendance_date[Op.lte] = to_date;
    }
  }

  return Attendance.findAll({
    where,
    attributes: [
      "code",
      "attendance_date",
      [fn("MIN", col("punch_time")), "punch_in_time"],
      [fn("MAX", col("punch_time")), "punch_out_time"],
      [fn("COUNT", col("id")), "punch_count"],
      [fn("MAX", col("id")), "edit_entry_id"],
      [literal("EXTRACT(EPOCH FROM (MAX(punch_time) - MIN(punch_time)))"), "total_seconds"],
      [literal("CASE WHEN COUNT(id) >= 2 THEN 'present' ELSE 'incomplete' END"), "day_status"],
    ],
    group: ["code", "attendance_date"],
    order: [
      ["attendance_date", "DESC"],
      ["code", "ASC"],
    ],
    raw: true,
  });
};

export {
  createAttendance,
  bulkCreateAttendances,
  updateAttendance,
  updateAttendancesByCodeAndDate,
  createAttendanceEditLog,
  findAttendanceById,
  findAttendancesByCodeAndDate,
  listAttendanceEditLogs,
  findAttendancesForImport,
  listAttendances,
  listAttendanceSummary,
};
