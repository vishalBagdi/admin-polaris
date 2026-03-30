import { Salary } from "../models/index.js";

const createSalary = async (payload) => Salary.create(payload);
const updateSalary = async (id, payload) => Salary.update(payload, { where: { id } });
const findSalaryById = async (id) => Salary.findByPk(id);
const findSalaryByEmployeeAndEffectiveFrom = async (employee_id, effective_from) =>
  Salary.findOne({ where: { employee_id, effective_from } });
const listSalaries = async ({ employee_id }) => {
  const where = employee_id ? { employee_id } : {};
  return Salary.findAll({ where, order: [["effective_from", "DESC"]] });
};

export {
  createSalary,
  updateSalary,
  findSalaryById,
  findSalaryByEmployeeAndEffectiveFrom,
  listSalaries,
};
