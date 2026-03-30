import { EmployeeDocument } from "../models/index.js";

const createEmployeeDocument = async (payload) => EmployeeDocument.create(payload);
const updateEmployeeDocument = async (id, payload) => EmployeeDocument.update(payload, { where: { id } });
const deleteEmployeeDocument = async (id) => EmployeeDocument.destroy({ where: { id } });
const findEmployeeDocumentById = async (id) => EmployeeDocument.findByPk(id);
const listEmployeeDocuments = async (employee_id) =>
  EmployeeDocument.findAll({ where: { employee_id }, order: [["created_at", "DESC"]] });

export {
  createEmployeeDocument,
  updateEmployeeDocument,
  deleteEmployeeDocument,
  findEmployeeDocumentById,
  listEmployeeDocuments,
};
