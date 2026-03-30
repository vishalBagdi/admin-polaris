import {
  createSubcategory,
  deleteSubcategory,
  findSubcategoryById,
  findSubcategoryByNameAndCategory,
  listSubcategories,
  updateSubcategory,
} from "../dao/subcategory.dao.js";
import { findCategoryById } from "../dao/category.dao.js";
import { getSignedObjectUrl } from "../config/s3.js";

const normalizeName = (value) => (value || "").toString().trim().replace(/\s+/g, " ");

const toNumber = (value, fieldName) => {
  const number = Number(value);
  if (Number.isNaN(number)) {
    const error = new Error(`${fieldName} must be a valid number.`);
    error.status = 400;
    throw error;
  }
  if (number < 0 || number > 100) {
    const error = new Error(`${fieldName} must be between 0 and 100.`);
    error.status = 400;
    throw error;
  }
  return number;
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

const resolveCategoryId = (payload) => {
  const value = payload?.category_id ?? payload?.categoryId ?? payload?.category ?? null;
  const normalized = Number(value);
  if (!value || Number.isNaN(normalized) || normalized <= 0) {
    const error = new Error("Category is required.");
    error.status = 400;
    throw error;
  }
  return normalized;
};

const normalizeImage = (value) => {
  const text = (value || "").toString().trim();
  return text || null;
};

const toPlain = (value) => (value && typeof value.toJSON === "function" ? value.toJSON() : value);

const withSignedImage = async (subcategory) => {
  const row = toPlain(subcategory);
  if (!row) return row;
  return {
    ...row,
    subcategory_images: await getSignedObjectUrl(row.subcategory_images),
  };
};

const create = async (payload) => {
  const categoryId = resolveCategoryId(payload);
  const name = normalizeName(payload?.name);
  const makingCharges = toNumber(
    payload?.making_charges ?? payload?.makingCharges ,
    "Making charges"
  );
  const materialLoss = toNumber(
    payload?.material_loss ??
      payload?.materialLoss ??
      payload?.matrial_loos ??
      payload?.matrialLoos ,
    "Material loss"
  );

  if (!name) {
    const error = new Error("Subcategory name is required.");
    error.status = 400;
    throw error;
  }

  const category = await findCategoryById(categoryId);
  if (!category) {
    const error = new Error("Category not found.");
    error.status = 404;
    throw error;
  }

  const existing = await findSubcategoryByNameAndCategory(name, categoryId);
  if (existing) {
    const error = new Error("Subcategory name already exists for selected category.");
    error.status = 409;
    throw error;
  }

  const status = resolveStatus(payload || {});
  const image = normalizeImage(payload?.subcategory_images);

  const created = await createSubcategory({
    category_id: categoryId,
    name,
    making_charges: makingCharges,
    material_loss: materialLoss,
    status,
    is_active: status === "active",
    subcategory_images: image,
  });

  return withSignedImage(created);
};

const list = async () => {
  const rows = await listSubcategories();
  return Promise.all((rows || []).map((row) => withSignedImage(row)));
};

const getById = async (id) => {
  if (!id) {
    const error = new Error("Subcategory id is required.");
    error.status = 400;
    throw error;
  }
  const subcategory = await findSubcategoryById(id);
  if (!subcategory) {
    const error = new Error("Subcategory not found.");
    error.status = 404;
    throw error;
  }
  return withSignedImage(subcategory);
};

const update = async (id, payload) => {
  if (!id) {
    const error = new Error("Subcategory id is required.");
    error.status = 400;
    throw error;
  }

  const subcategory = await findSubcategoryById(id);
  if (!subcategory) {
    const error = new Error("Subcategory not found.");
    error.status = 404;
    throw error;
  }

  const categoryId = resolveCategoryId({
    category_id: payload?.category_id ?? payload?.categoryId ?? subcategory.category_id,
  });
  const name = normalizeName(payload?.name ?? subcategory.name);
  const makingCharges = toNumber(
    payload?.making_charges ??
      payload?.makingCharges ??
      subcategory.making_charges,
    "Making charges"
  );
  const materialLoss = toNumber(
    payload?.material_loss ??
      payload?.materialLoss ??
      payload?.matrial_loos ??
      payload?.matrialLoos ??
    
      subcategory.material_loss,
    "Material loss"
  );

  if (!name) {
    const error = new Error("Subcategory name is required.");
    error.status = 400;
    throw error;
  }

  const category = await findCategoryById(categoryId);
  if (!category) {
    const error = new Error("Category not found.");
    error.status = 404;
    throw error;
  }

  const existing = await findSubcategoryByNameAndCategory(name, categoryId);
  if (existing && String(existing.id) !== String(id)) {
    const error = new Error("Subcategory name already exists for selected category.");
    error.status = 409;
    throw error;
  }

  const status = resolveStatus({
    status: payload?.status ?? subcategory.status,
    is_active: payload?.is_active,
  });

  await updateSubcategory(id, {
    category_id: categoryId,
    name,
    making_charges: makingCharges,
    material_loss: materialLoss,
    status,
    is_active: status === "active",
    subcategory_images:
      payload?.subcategory_images !== undefined
        ? normalizeImage(payload?.subcategory_images)
        : subcategory.subcategory_images,
  });

  const updated = await findSubcategoryById(id);
  return withSignedImage(updated);
};

const remove = async (id) => {
  if (!id) {
    const error = new Error("Subcategory id is required.");
    error.status = 400;
    throw error;
  }

  const subcategory = await findSubcategoryById(id);
  if (!subcategory) {
    const error = new Error("Subcategory not found.");
    error.status = 404;
    throw error;
  }

  await deleteSubcategory(id);
  return { message: "Subcategory deleted successfully." };
};

export { create, list, getById, update, remove };
