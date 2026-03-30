import {
  create as createUser,
  getById as getUserById,
  list as listUsers,
  remove as removeUser,
  update as updateUser,
} from "../services/user.service.js";

const mapFileToPayload = (req) => {
  const file = req.file;
  if (!file) return {};
  const uploadedPath = file.location || (file.filename ? `/storage/users/${file.filename}` : null);
  if (!uploadedPath) return {};
  return { profile_photo: uploadedPath };
};

const create = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFileToPayload(req) };
    const user = await createUser(payload);
    return res.status(201).json(user);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "User creation failed.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFileToPayload(req) };
    const user = await updateUser(req.params.id, payload);
    return res.status(200).json(user);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "User update failed.";
    return res.status(status).json({ message });
  }
};

const list = async (_req, res) => {
  try {
    const users = await listUsers();
    return res.status(200).json(users);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Users fetch failed.";
    return res.status(status).json({ message });
  }
};

const get = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);
    return res.status(200).json(user);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "User fetch failed.";
    return res.status(status).json({ message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await removeUser(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "User delete failed.";
    return res.status(status).json({ message });
  }
};

export { create, update, list, get, remove };
