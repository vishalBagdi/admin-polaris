import { create as createSalary, list as listSalary, update as updateSalary } from "../services/salary.service.js";

const create = async (req, res) => {
  try {
    const result = await createSalary(req.body || {});
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Salary creation failed.";
    return res.status(status).json({ message });
  }
};

const list = async (req, res) => {
  try {
    const result = await listSalary(req.query || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch salaries.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const result = await updateSalary(req.params.id, req.body || {});
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Salary update failed.";
    return res.status(status).json({ message });
  }
};

export { create, list, update };
