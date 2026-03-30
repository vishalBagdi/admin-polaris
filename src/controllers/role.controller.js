import { create as createRole, list as listRoles, update as updateRole } from "../services/role.service.js";

const create = async (req, res) => {
  try {
    const role = await createRole(req.body || {});
    return res.status(201).json(role);
  } catch (error) {
    console.error("Role creation error:", error);
    const status = error.status || 500;
    const message = error.message || "Role creation failed.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const role = await updateRole(req.params.id, req.body || {});
    return res.status(200).json(role);
  } catch (error) {
    console.error("Role update error:", error);
    const status = error.status || 500;
    const message = error.message || "Role update failed.";
    return res.status(status).json({ message });
  }
};

const list = async (_req, res) => {
  try {
    const roles = await listRoles();
    return res.status(200).json(roles);
  } catch (error) {
    console.error("Role list error:", error);
    const status = error.status || 500;
    const message = error.message || "Roles fetch failed.";
    return res.status(status).json({ message });
  }
};

export { create, update, list };
