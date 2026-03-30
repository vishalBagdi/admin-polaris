import {
  create as createCategory,
  getById as getCategoryById,
  list as listCategories,
  remove as removeCategory,
  update as updateCategory,
} from "../services/category.service.js";

const mapFileToPayload = (req) => {
  const file = req.file;
  if (!file) return {};
  const uploadedPath = file.location || (file.filename ? `/storage/category/${file.filename}` : null);
  if (!uploadedPath) return {};
  return { category_images: uploadedPath };
};

const create = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFileToPayload(req) };
    const result = await createCategory(payload);
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Category creation failed.";
    return res.status(status).json({ message });
  }
};

const list = async (_req, res) => {
  try {
    const result = await listCategories();
    return res.status(200).json(result);
  } catch (error) {

    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch categories.";
    return res.status(status).json({ message });
  }
};

const get = async (req, res) => {
  try {
    const result = await getCategoryById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch category.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFileToPayload(req) };
    const result = await updateCategory(req.params.id, payload);
    return res.status(200).json(result);

  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Category update failed.";
    return res.status(status).json({ message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await removeCategory(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Category delete failed.";
    return res.status(status).json({ message });

  }
};

export { create, list, get, update, remove };
