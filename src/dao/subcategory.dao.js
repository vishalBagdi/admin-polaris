import { Category, Subcategory } from "../models/index.js";

const createSubcategory = async (payload) => Subcategory.create(payload);
const updateSubcategory = async (id, payload) => Subcategory.update(payload, { where: { id } });
const deleteSubcategory = async (id) => Subcategory.destroy({ where: { id } });
const findSubcategoryById = async (id) =>
  Subcategory.findByPk(id, {
    include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
  });
const findSubcategoryByNameAndCategory = async (name, category_id) =>
  Subcategory.findOne({ where: { name, category_id } });
const listSubcategories = async () =>
  Subcategory.findAll({
    include: [{ model: Category, as: "category", attributes: ["id", "name"] }],
    order: [["created_at", "DESC"]],
  });

export {
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  findSubcategoryById,
  findSubcategoryByNameAndCategory,
  listSubcategories,
};
