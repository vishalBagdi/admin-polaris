import {
  createSalary,
  findSalaryByEmployeeAndEffectiveFrom,
  findSalaryById,
  listSalaries,
  updateSalary,
} from "../dao/salary.dao.js";
import { findEmployeeProfileById } from "../dao/employeeProfile.dao.js";

const validateMoney = (value, fieldName) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) {
    const error = new Error(`${fieldName} must be a positive number.`);
    error.status = 400;
    throw error;
  }

  return parsed;
};

const validateBoolean = (value, fieldName) => {
  if (typeof value === "boolean") return value;
  if (value === undefined || value === null || value === "") return false;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "true" || normalized === "yes" || normalized === "1") return true;
    if (normalized === "false" || normalized === "no" || normalized === "0") return false;
  }
  const error = new Error(`${fieldName} must be a boolean.`);
  error.status = 400;
  throw error;
};

const validateInteger = (value, fieldName) => {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    const error = new Error(`${fieldName} must be a non-negative integer.`);
    error.status = 400;
    throw error;
  }
  return parsed;
};

const create = async ({
  employee_id,
  effective_from,
  basic_salary,
  hra,
  ta,
  da,
  special_allowance,
  pf,
  pf_number,
  esi,
  esi_number,
  bonus_once_a_year,
  advance_loan,
  advance_money,
  other_perks,
  paid_leaves,
  allowances,
  deductions,
  currency,
  payment_frequency,
}) => {
  if (!employee_id || !effective_from || basic_salary === undefined) {
    const error = new Error("Employee id, effective from date, and basic salary are required.");
    error.status = 400;
    throw error;
  }

  const employee = await findEmployeeProfileById(employee_id);
  if (!employee) {
    const error = new Error("Employee profile not found.");
    error.status = 404;
    throw error;
  }

  const existing = await findSalaryByEmployeeAndEffectiveFrom(employee_id, effective_from);
  if (existing) {
    const error = new Error("Salary already exists for this employee and effective date.");
    error.status = 409;
    throw error;
  }

  return createSalary({
    employee_id,
    effective_from,
    basic_salary: validateMoney(basic_salary, "Basic salary"),
    hra:
      hra !== undefined
        ? validateMoney(hra, "HRA")
        : allowances !== undefined
          ? validateMoney(allowances, "Allowances")
          : 0,
    ta: ta !== undefined ? validateMoney(ta, "TA") : 0,
    da: da !== undefined ? validateMoney(da, "DA") : 0,
    special_allowance:
      special_allowance !== undefined
        ? validateMoney(special_allowance, "Special allowance")
        : 0,
    pf:
      pf !== undefined
        ? validateMoney(pf, "PF")
        : deductions !== undefined
          ? validateMoney(deductions, "Deductions")
          : 0,
    pf_number: pf_number || null,
    esi: esi !== undefined ? validateMoney(esi, "ESI") : 0,
    esi_number: esi_number || null,
    bonus_once_a_year:
      bonus_once_a_year !== undefined
        ? validateMoney(bonus_once_a_year, "Bonus")
        : 0,
    advance_loan: validateBoolean(advance_loan, "Advance loan"),
    advance_money:
      advance_money !== undefined
        ? validateMoney(advance_money, "Advance money")
        : 0,
    other_perks:
      other_perks !== undefined
        ? validateMoney(other_perks, "Other perks")
        : 0,
    paid_leaves:
      paid_leaves !== undefined
        ? validateInteger(paid_leaves, "Paid leaves")
        : 0,
    currency: currency || "USD",
    payment_frequency: payment_frequency || "monthly",
  });
};

const list = async ({ employee_id }) => listSalaries({ employee_id });

const update = async (id, payload) => {
  if (!id) {
    const error = new Error("Salary id is required.");
    error.status = 400;
    throw error;
  }

  const salary = await findSalaryById(id);
  if (!salary) {
    const error = new Error("Salary record not found.");
    error.status = 404;
    throw error;
  }

  await updateSalary(id, {
    basic_salary:
      payload.basic_salary !== undefined
        ? validateMoney(payload.basic_salary, "Basic salary")
        : salary.basic_salary,
    hra:
      payload.hra !== undefined
        ? validateMoney(payload.hra, "HRA")
        : payload.allowances !== undefined
          ? validateMoney(payload.allowances, "Allowances")
          : salary.hra,
    ta:
      payload.ta !== undefined
        ? validateMoney(payload.ta, "TA")
        : salary.ta,
    da:
      payload.da !== undefined
        ? validateMoney(payload.da, "DA")
        : salary.da,
    special_allowance:
      payload.special_allowance !== undefined
        ? validateMoney(payload.special_allowance, "Special allowance")
        : salary.special_allowance,
    pf:
      payload.pf !== undefined
        ? validateMoney(payload.pf, "PF")
        : payload.deductions !== undefined
          ? validateMoney(payload.deductions, "Deductions")
          : salary.pf,
    pf_number: payload.pf_number ?? salary.pf_number,
    esi:
      payload.esi !== undefined
        ? validateMoney(payload.esi, "ESI")
        : salary.esi,
    esi_number: payload.esi_number ?? salary.esi_number,
    bonus_once_a_year:
      payload.bonus_once_a_year !== undefined
        ? validateMoney(payload.bonus_once_a_year, "Bonus")
        : salary.bonus_once_a_year,
    advance_loan:
      payload.advance_loan !== undefined
        ? validateBoolean(payload.advance_loan, "Advance loan")
        : salary.advance_loan,
    advance_money:
      payload.advance_money !== undefined
        ? validateMoney(payload.advance_money, "Advance money")
        : salary.advance_money,
    other_perks:
      payload.other_perks !== undefined
        ? validateMoney(payload.other_perks, "Other perks")
        : salary.other_perks,
    paid_leaves:
      payload.paid_leaves !== undefined
        ? validateInteger(payload.paid_leaves, "Paid leaves")
        : salary.paid_leaves,
    currency: payload.currency ?? salary.currency,
    payment_frequency: payload.payment_frequency ?? salary.payment_frequency,
  });

  return findSalaryById(id);
};

export { create, list, update };
