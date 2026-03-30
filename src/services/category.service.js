import {
  createCategory,
  deleteCategory,
  findCategoryById,
  findCategoryByName,
  findCategoryBySlug,
  listCategories,
  updateCategory,
} from "../dao/category.dao.js";
import { getSignedObjectUrl } from "../config/s3.js";

const normalizeName = (value) => (value || "").toString().trim().replace(/\s+/g, " ");

const normalizeSlug = (value) => {
  const raw = (value || "").toString().trim();
  if (!raw) return "";
  const cleaned = raw
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9/_]/g, "")
    .replace(/\/+/g, "/")
    .replace(/_+/g, "_")
    .replace(/(^\/+|\/+$)/g, "")
    .replace(/(^_+|_+$)/g, "");
  return `/${cleaned}`;
};

const resolveStatus = ({ status, is_active }) => {
  if (typeof status === "string") {
    return status.toLowerCase() === "inactive" ? "inactive" : "active";
  }
  if (typeof is_active === "boolean") {
    return is_active ? "active" : "inactive";
  }
  return "active";
};

const normalizeDescription = (value) => {
  const text = (value || "").toString().trim();
  return text || null;
};

const normalizeImage = (value) => {
  const text = (value || "").toString().trim();
  return text || null;
};

const toPlain = (value) => {
  if (!value) return value;
  if (typeof value.toJSON === "function") return value.toJSON();
  return value;
};

const withSignedImage = async (category) => {
  const row = toPlain(category);
  if (!row) return row;
  return {
    ...row,
    category_images: await getSignedObjectUrl(row.category_images),
  };
};

const create = ({ name, slug, status, description, is_active, category_images }) => {
  return createInternal({ name, slug, status, description, is_active, category_images });
};

const createInternal = async ({ name, slug, status, description, is_active, category_images }) => {
  const normalizedName = normalizeName(name);
  const normalizedSlug = normalizeSlug(slug || normalizedName);
  const normalizedDescription = normalizeDescription(description);
  const normalizedStatus = resolveStatus({ status, is_active });
  const normalizedImage = normalizeImage(category_images);

  if (!normalizedName) {
    const error = new Error("Category name is required.");
    error.status = 400;
    throw error;
  }

  if (!normalizedSlug || normalizedSlug === "/") {
    const error = new Error("Category slug is required.");
    error.status = 400;
    throw error;
  }

  const existingByName = await findCategoryByName(normalizedName);
  if (existingByName) {
    const error = new Error("Category name already exists.");
    error.status = 409;
    throw error;
  }

  const existingBySlug = await findCategoryBySlug(normalizedSlug);
  if (existingBySlug) {
    const error = new Error("Category slug already exists.");
    error.status = 409;
    throw error;
  }

  const created = await createCategory({
    name: normalizedName,
    slug: normalizedSlug,
    status: normalizedStatus,
    description: normalizedDescription,
    is_active: normalizedStatus === "active",
    category_images: normalizedImage,
  });

  return withSignedImage(created);
};

const list = async () => {
  const rows = await listCategories();
  return Promise.all((rows || []).map((row) => withSignedImage(row)));
};

const getById = async (id) => {
  if (!id) {
    const error = new Error("Category id is required.");
    error.status = 400;
    throw error;
  }
  const category = await findCategoryById(id);
  if (!category) {
    const error = new Error("Category not found.");
    error.status = 404;
    throw error;
  }
  return withSignedImage(category);
};

const update = async (id, { name, slug, status, description, is_active, category_images }) => {
  if (!id) {
    const error = new Error("Category id is required.");
    error.status = 400;
    throw error;
  }

  const category = await findCategoryById(id);
  if (!category) {
    const error = new Error("Category not found.");
    error.status = 404;
    throw error;
  }

  const normalizedName = normalizeName(name ?? category.name);
  const normalizedSlug = normalizeSlug(slug ?? category.slug);

  if (!normalizedName) {
    const error = new Error("Category name is required.");
    error.status = 400;
    throw error;
  }

  if (!normalizedSlug || normalizedSlug === "/") {
    const error = new Error("Category slug is required.");
    error.status = 400;
    throw error;
  }

  const existingByName = await findCategoryByName(normalizedName);
  if (existingByName && String(existingByName.id) !== String(id)) {
    const error = new Error("Category name already exists.");
    error.status = 409;
    throw error;
  }

  const existingBySlug = await findCategoryBySlug(normalizedSlug);
  if (existingBySlug && String(existingBySlug.id) !== String(id)) {
    const error = new Error("Category slug already exists.");
    error.status = 409;
    throw error;
  }

  const normalizedStatus = resolveStatus({
    status: status ?? category.status,
    is_active,
  });

  await updateCategory(id, {
    name: normalizedName,
    slug: normalizedSlug,
    status: normalizedStatus,
    description: description !== undefined ? normalizeDescription(description) : category.description,
    is_active: normalizedStatus === "active",
    category_images:
      category_images !== undefined ? normalizeImage(category_images) : category.category_images,
  });

  const updated = await findCategoryById(id);
  return withSignedImage(updated);
};

const remove = async (id) => {
  if (!id) {
    const error = new Error("Category id is required.");
    error.status = 400;
    throw error;
  }

  const category = await findCategoryById(id);
  if (!category) {
    const error = new Error("Category not found.");
    error.status = 404;
    throw error;
  }

  await deleteCategory(id);
  return { message: "Category deleted successfully." };
};

export { create, list, getById, update, remove };
