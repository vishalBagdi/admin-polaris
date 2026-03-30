import {
  create as createSubcategory,
  getById as getSubcategoryById,
  list as listSubcategories,
  remove as removeSubcategory,
  update as updateSubcategory,
} from "../services/subcategory.service.js";

const mapFileToPayload = (req) => {
  const file = req.file;
  if (!file) return {};
  const uploadedPath = file.location || (file.filename ? `/storage/subcategory/${file.filename}` : null);
  if (!uploadedPath) return {};
  return { subcategory_images: uploadedPath };
};

const create = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFileToPayload(req) };
    const result = await createSubcategory(payload);
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Subcategory creation failed.";
    return res.status(status).json({ message });
  }
};

const list = async (_req, res) => {
  try {
    const result = await listSubcategories();
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch subcategories.";
    return res.status(status).json({ message });
  }
};

const get = async (req, res) => {
  try {
    const result = await getSubcategoryById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch subcategory.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFileToPayload(req) };
    const result = await updateSubcategory(req.params.id, payload);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Subcategory update failed.";
    return res.status(status).json({ message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await removeSubcategory(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Subcategory delete failed.";
    return res.status(status).json({ message });
  }
};

export { create, list, get, update, remove };
