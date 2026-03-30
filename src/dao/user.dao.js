import { Op } from "sequelize";
import { Role, User } from "../models/index.js";

const findByEmail = async (email) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail) return null;
  return User.findOne({
    where: {
      email: {
        [Op.iLike]: normalizedEmail,
      },
    },
  });
};
const createUser = async (payload) => User.create(payload);
const updateUser = async (id, payload) => User.update(payload, { where: { id } });
const deleteUser = async (id) => {
  const user = await User.findByPk(id);
  if (!user) return 0;

  await user.destroy();
  return 1;
};
const roleInclude = [
  {
    model: Role,
    as: "role",
    attributes: ["id", "name"],
    required: false,
  },
];

const findById = async (id) => {
  try {
    return await User.findByPk(id, { include: roleInclude });
  } catch (error) {
    console.error("findById with role include failed, falling back:", error?.message || error);
    return User.findByPk(id);
  }
};

const listUsers = async () => {
  try {
    return await User.findAll({
      order: [["createdAt", "DESC"]],
      include: roleInclude,
    });
  } catch (error) {
    console.error("listUsers with role include/order failed, falling back:", error?.message || error);
    return User.findAll({
      order: [["id", "DESC"]],
    });
  }
};
const findByResetToken = async (tokenHash) =>
  User.findOne({
    where: {
      reset_password_token: tokenHash,
      reset_password_expires_at: { [Op.gt]: new Date() },
    },
  });

export { findByEmail, createUser, updateUser, deleteUser, findById, listUsers, findByResetToken };
