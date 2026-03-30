import { Role } from "../models/index.js";

const createRole = async (payload) => Role.create(payload);
const updateRole = async (id, payload) => Role.update(payload, { where: { id } });
const findById = async (id) => Role.findByPk(id);
const findByName = async (name) => Role.findOne({ where: { name } });
const listRoles = async () =>
  Role.findAll({
    order: [["created_at", "DESC"]],
  });

export { createRole, updateRole, findById, findByName, listRoles };
