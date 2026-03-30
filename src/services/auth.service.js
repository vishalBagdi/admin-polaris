import bcrypt from "bcryptjs";
import crypto from "crypto";
import { createUser, findByEmail, findByResetToken, updateUser } from "../dao/user.dao.js";
import { findById as findRoleById, findByName as findRoleByName } from "../dao/role.dao.js";
import { signToken, sanitizeUser } from "../config/auth.js";
import { sendMail } from "../config/mail.js";
import { getSignedObjectUrl } from "../config/s3.js";

const withSignedProfilePhoto = async (user) => ({
  ...sanitizeUser(user),
  profile_photo: await getSignedObjectUrl(user?.profile_photo),
});

const login = async ({ email, password }) => {
  if (!email || !password) {
    const error = new Error("Email and password required.");
    error.status = 400;
    throw error;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = await findByEmail(normalizedEmail);
  if (!user) {
    const error = new Error("Invalid credentials.");
    error.status = 401;
    throw error;
  }

  if (!user.is_active) {
    const error = new Error("User is inactive.");
    error.status = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error("Invalid password.");
    error.status = 401;
    throw error;
  }

  const token = signToken({ sub: user.id, role_id: user.role_id });
  const role = user.role_id ? await findRoleById(user.role_id) : null;
  return { token, user: await withSignedProfilePhoto(user), role };
};

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

  const defaultRole = await findRoleByName("user");
  return defaultRole ? defaultRole.id : null;
};

const normalizeOptionalText = (value) => {
  if (typeof value !== "string") return value ?? null;
  const trimmed = value.trim();
  return trimmed || null;
};

const register = async ({
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

  const token = signToken({ sub: user.id, role_id: user.role_id });
  const role = user.role_id ? await findRoleById(user.role_id) : null;
  return { token, user: await withSignedProfilePhoto(user), role };
};

const getResetBaseUrl = () => {
  const base = process.env.FRONTEND_BASE_URL ;
  return base.replace(/\/$/, "");
};

const requestPasswordReset = async ({ email }) => {
  if (!email) {
    const error = new Error("Email required.");
    error.status = 400;
    throw error;
  }

  const user = await findByEmail(email);
  if (!user) {
    return { message: "If the account exists, a reset email has been sent." };
  }

  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 2);

  await updateUser(user.id, {
    reset_password_token: tokenHash,
    reset_password_expires_at: expiresAt,
  });

  const resetUrl = `${getResetBaseUrl()}/reset-password?token=${rawToken}`;
  const subject = "Reset your password";
  const text = `You requested a password reset. This link expires in 30 minutes: ${resetUrl}`;
  const html = `<p>You requested a password reset.</p><p>This link expires in 30 minutes:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`;

  await sendMail({ to: user.email, subject, text, html });

  return { message: "If the account exists, a reset email has been sent." };
};

const resetPassword = async ({ token, password, confirm_password }) => {
  if (!token || !password || !confirm_password) {
    const error = new Error("Token, password, and confirm password required.");
    error.status = 400;
    throw error;
  }

  if (password !== confirm_password) {
    const error = new Error("Passwords do not match.");
    error.status = 400;
    throw error;
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await findByResetToken(tokenHash);
  if (!user) {
    const error = new Error("Invalid or expired reset token.");
    error.status = 400;
    throw error;
  }

  const password_hash = await bcrypt.hash(password, 10);
  await updateUser(user.id, {
    password_hash,
    reset_password_token: null,
    reset_password_expires_at: null,
  });

  try {
    const subject = "Password reset successful";
    const text =
      "Your password has been updated successfully. If you did not perform this action, please contact support immediately.";
    const html =
      "<p>Your password has been updated successfully.</p><p>If you did not perform this action, please contact support immediately.</p>";
    await sendMail({ to: user.email, subject, text, html });
  } catch (error) {
    console.error("Password reset confirmation email failed:", error?.message || error);
  }

  return { message: "Password has been reset successfully.", user: await withSignedProfilePhoto(user) };
};

export { login, register, requestPasswordReset, resetPassword };
