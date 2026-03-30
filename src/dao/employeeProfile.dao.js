import { EmployeeDocument, EmployeeProfile, Salary } from "../models/index.js";

const createEmployeeProfile = async (payload) => EmployeeProfile.create(payload);
const updateEmployeeProfile = async (id, payload) => EmployeeProfile.update(payload, { where: { id } });
const findEmployeeProfileById = async (id) =>
  EmployeeProfile.findByPk(id, {
    include: [
      { model: EmployeeDocument, as: "documents" },
      { model: Salary, as: "salaries" },
    ],
  });
const findEmployeeProfileByCode = async (code) =>
  EmployeeProfile.findOne({
    where: { code },
    include: [
      { model: EmployeeDocument, as: "documents" },
      { model: Salary, as: "salaries" },
    ],
  });
const listEmployeeProfiles = async () =>
  EmployeeProfile.findAll({
    include: [
      { model: EmployeeDocument, as: "documents" },
      { model: Salary, as: "salaries" },
    ],
    order: [["created_at", "DESC"]],
  });
const deleteEmployeeProfile = async (id) => EmployeeProfile.destroy({ where: { id } });
const findEmployeeProfilesByCodes = async (codes) =>
  EmployeeProfile.findAll({
    where: { code: codes },
    attributes: ["id", "code", "full_name", "department", "designation"],
  });
const listActiveEmployeeProfilesForAttendance = async ({ code } = {}) => {
  const where = {
    is_active: true,
  };

  if (code) {
    where.code = code;
  }

  return EmployeeProfile.findAll({
    where,
    attributes: ["id", "code", "full_name", "department", "designation", "photo"],
    order: [["code", "ASC"], ["id", "ASC"]],
  });
};
export {
  createEmployeeProfile,
  updateEmployeeProfile,
  findEmployeeProfileById,
  findEmployeeProfileByCode,
  findEmployeeProfilesByCodes,
  listActiveEmployeeProfilesForAttendance,
  listEmployeeProfiles,
  deleteEmployeeProfile,
};
