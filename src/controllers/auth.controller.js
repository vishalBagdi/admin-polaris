import {
  login as loginService,
  register as registerService,
  requestPasswordReset,
  resetPassword,
} from "../services/auth.service.js";

const login = async (req, res) => {
  try {
    const result = await loginService(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Login failed.";
    return res.status(status).json({ message });
  }
};

const register = async (req, res) => {
  try {
    const result = await registerService(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Registration failed.";
    return res.status(status).json({ message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const result = await requestPasswordReset(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Password reset request failed.";
    return res.status(status).json({ message });
  }
};

const changePassword = async (req, res) => {
  try {
    const result = await resetPassword(req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Password reset failed.";
    return res.status(status).json({ message });
  }
};

export { login, register, forgotPassword, changePassword };
