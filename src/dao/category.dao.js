import { Category } from "../models/index.js";

const createCategory = async (payload) => Category.create(payload);
const updateCategory = async (id, payload) => Category.update(payload, { where: { id } });
const deleteCategory = async (id) => Category.destroy({ where: { id } });
const findCategoryById = async (id) => Category.findByPk(id);
const findCategoryByName = async (name) => Category.findOne({ where: { name } });
const findCategoryBySlug = async (slug) => Category.findOne({ where: { slug } });
const listCategories = async () => Category.findAll({ order: [["created_at", "DESC"]] });

export {
  createCategory,
  updateCategory,
  deleteCategory,
  findCategoryById,
  findCategoryByName,
  findCategoryBySlug,
  listCategories,
};
