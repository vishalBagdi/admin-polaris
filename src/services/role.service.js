import { createRole, findById, findByName, listRoles, updateRole } from "../dao/role.dao.js";

const create = async ({ name, description, permissions }) => {
  if (!name) {
    const error = new Error("Role name required.");
    error.status = 400;
    throw error;
  }

  const existing = await findByName(name);
  if (existing) {
    const error = new Error("Role name already exists.");
    error.status = 409;
    throw error;
  }

  return createRole({
    name,
    description: description || null,
    permissions: permissions || {},
  });
};

const update = async (id, { name, description, permissions }) => {
  if (!id) {
    const error = new Error("Role id required.");
    error.status = 400;
    throw error;
  }

  const role = await findById(id);
  if (!role) {
    const error = new Error("Role not found.");
    error.status = 404;
    throw error;
  }

  if (name && name !== role.name) {
    const existing = await findByName(name);
    if (existing) {
      const error = new Error("Role name already exists.");
      error.status = 409;
      throw error;
    }
  }

  await updateRole(id, {
    name: name ?? role.name,
    description: description ?? role.description,
    permissions: permissions ?? role.permissions,
  });

  return findById(id);
};

const list = async () => listRoles();

export { create, update, list };
