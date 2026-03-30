import bcrypt from "bcryptjs";
import { createUser, deleteUser, findByEmail, findById, listUsers, updateUser } from "../dao/user.dao.js";
import { findById as findRoleById, findByName as findRoleByName } from "../dao/role.dao.js";
import { sanitizeUser } from "../config/auth.js";
import { getSignedObjectUrl } from "../config/s3.js";

const resolveProfilePhotoUrl = async (value) => {
  try {
    return await getSignedObjectUrl(value);
  } catch (error) {
    console.error("Profile photo URL signing failed:", error?.message || error);
    return value || null;
  }
};

const withSignedProfilePhoto = async (user) => ({
  ...sanitizeUser(user),
  profile_photo: await resolveProfilePhotoUrl(user?.profile_photo),
});

const resolveRoleId = async ({ role_id, role_name }) => {
  if (role_id) {
    const role = await findRoleById(role_id);
    if (!role) {
      const error = new Error("Role not found.");
      error.status = 400;
      throw error;
    }
    return role.id;
  }

  if (role_name) {
    const role = await findRoleByName(role_name);
    if (!role) {
      const error = new Error("Role not found.");
      error.status = 400;
      throw error;
    }
    return role.id;
  }

  return null;
};

const normalizeOptionalText = (value) => {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed || null;
};

const create = async ({
  email,
  password,
  name,
  phone,
  bio,
  profile_photo,
  profilePhoto,
  role_id,
  role_name,
  is_active,
}) => {
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!normalizedEmail || !password || !name) {
    const error = new Error("Name, email, and password required.");
    error.status = 400;
    throw error;
  }

  const existing = await findByEmail(normalizedEmail);
  if (existing) {
    const error = new Error("Email already exists.");
    error.status = 409;
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 10);
  const resolvedRoleId = await resolveRoleId({ role_id, role_name });
  const user = await createUser({
    email: normalizedEmail,
    name,
    password_hash,
    phone: normalizeOptionalText(phone),
    bio: normalizeOptionalText(bio),
    profile_photo: normalizeOptionalText(profile_photo ?? profilePhoto),
    role_id: resolvedRoleId,
    is_active: typeof is_active === "boolean" ? is_active : true,
  });

  return withSignedProfilePhoto(user);
};

const update = async (
  id,
  { email, password, name, phone, bio, profile_photo, profilePhoto, role_id, is_active }
) => {
  if (!id) {
    const error = new Error("User id required.");
    error.status = 400;
    throw error;
  }

  const user = await findById(id);
  if (!user) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }

  const normalizedEmail =
    typeof email === "string" && email.trim().length > 0 ? email.trim().toLowerCase() : null;

  if (normalizedEmail && normalizedEmail !== user.email) {
    const existing = await findByEmail(normalizedEmail);
    if (existing) {
      const error = new Error("Email already exists.");
      error.status = 409;
      throw error;
    }
  }

  const payload = {
    email: normalizedEmail ?? user.email,
    name: name ?? user.name,
    phone: phone !== undefined ? normalizeOptionalText(phone) : user.phone,
    bio: bio !== undefined ? normalizeOptionalText(bio) : user.bio,
    profile_photo:
      profile_photo !== undefined || profilePhoto !== undefined
        ? normalizeOptionalText(profile_photo ?? profilePhoto)
        : user.profile_photo,
    role_id: role_id ?? user.role_id,
    is_active: typeof is_active === "boolean" ? is_active : user.is_active,
  };

  if (password) {
    payload.password_hash = await bcrypt.hash(password, 10);
  }

  await updateUser(id, payload);
  const updated = await findById(id);
  return withSignedProfilePhoto(updated);
};

const list = async () => {
  const users = await listUsers();
  return Promise.all(
    users.map(async (user) => ({
      ...(await withSignedProfilePhoto(user)),
      role_name: user.role?.name || null,
    }))
  );
};

const getById = async (id) => {
  if (!id) {
    const error = new Error("User id required.");
    error.status = 400;
    throw error;
  }

  const user = await findById(id);
  if (!user) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }

  return {
    ...(await withSignedProfilePhoto(user)),
    role_name: user.role?.name || null,
  };
};

const remove = async (id) => {
  if (!id) {
    const error = new Error("User id required.");
    error.status = 400;
    throw error;
  }

  const deletedCount = await deleteUser(id);
  if (!deletedCount) {
    const error = new Error("User not found.");
    error.status = 404;
    throw error;
  }

  return { message: "User deleted successfully." };
};

export { create, update, list, getById, remove };
