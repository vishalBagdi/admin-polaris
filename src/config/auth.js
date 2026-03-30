import jwt from "jsonwebtoken";
import { findById as findUserById } from "../dao/user.dao.js";
import { findById as findRoleById } from "../dao/role.dao.js";

const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    const error = new Error("JWT secret not configured.");
    error.status = 500;
    throw error;
  }
  return secret;
};

const getJwtExpiresIn = () => process.env.JWT_EXPIRES_IN || "7d";

const signToken = (payload) =>
  jwt.sign(payload, getJwtSecret(), { expiresIn: getJwtExpiresIn() });

const sanitizeUser = (user) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  phone: user.phone,
  bio: user.bio,
  profile_photo: user.profile_photo,
  role_id: user.role_id,
  is_active: user.is_active,
});

const normalizeUserId = (value) => {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d+$/.test(trimmed)) return Number(trimmed);
  }
  return null;
};

const resolveUserIdFromPayload = (payload) =>
  normalizeUserId(payload?.sub) ??
  normalizeUserId(payload?.id) ??
  normalizeUserId(payload?.user?.id) ??
  null;

const requireAuth = () => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Authorization token required." });
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (_error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const userId = resolveUserIdFromPayload(payload);
    if (!userId) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    let user;
    try {
      user = await findUserById(userId);
    } catch (_error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "User is inactive." });
    }

    req.user = sanitizeUser(user);
    req.auth = { user: req.user, token: payload };

    return next();
  } catch (error) {
    return next(error);
  }
};

const requireAuthAndRole = (roles = []) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

    if (!token) {
      return res.status(401).json({ message: "Authorization token required." });
    }

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret());
    } catch (_error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    const userId = resolveUserIdFromPayload(payload);
    if (!userId) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }

    let user;
    try {
      user = await findUserById(userId);
    } catch (_error) {
      return res.status(401).json({ message: "Invalid or expired token." });
    }
    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "User is inactive." });
    }

    const roleId = user.role_id;
    if (!roleId) {
      return res.status(403).json({ message: "User role not assigned." });
    }

    const role = await findRoleById(roleId);
    if (!role) {
      return res.status(403).json({ message: "User role not found." });
    }

    if (roles.length > 0) {
      const allowed = new Set(roles.map((name) => name.toLowerCase()));
      if (!role.name || !allowed.has(role.name.toLowerCase())) {
        return res.status(403).json({ message: "Insufficient role permissions." });
      }
    }

    req.user = sanitizeUser(user);
    req.role = role;
    req.auth = { user: req.user, token: payload };

    return next();
  } catch (error) {
    return next(error);
  }
};

export { getJwtSecret, getJwtExpiresIn, signToken, sanitizeUser, requireAuth, requireAuthAndRole };
