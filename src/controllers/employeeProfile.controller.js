import {
  create as createEmployeeProfile,
  findById as findEmployeeProfileById,
  list as listEmployeeProfiles,
  remove as removeEmployeeProfile,
  update as updateEmployeeProfile,
} from "../services/employeeProfile.service.js";

const mapFilesToPayload = (req) => {
  const files = req.files || {};
  const toStoredPath = (entry) => {
    const file = Array.isArray(entry) ? entry[0] : entry;
    if (!file) return null;
    return file.key || file.location || (file.filename ? `/storage/employee-documents/${file.filename}` : null);
  };

  const mapped = {};
  const profilePhotoPath = toStoredPath(files.photo);
  const panFilePath = toStoredPath(files.panFile);
  const aadhaarFilePath = toStoredPath(files.aadhaarFile);
  const passbookPath = toStoredPath(files.passbookFrontPagePhoto);
  const esiPhotoPath = toStoredPath(files.esiPhoto);
  const documentPath = toStoredPath(files.documentFile);

  if (profilePhotoPath) mapped.photo = profilePhotoPath;
  if (panFilePath) mapped.pan_document_url = panFilePath;
  if (aadhaarFilePath) mapped.aadhaar_document_url = aadhaarFilePath;
  if (esiPhotoPath) mapped.esi_photo_url = esiPhotoPath;
  if (passbookPath) mapped.passbook_front_page_photo_url = passbookPath;
  if (documentPath) mapped.document_url = documentPath;

  return mapped;
};

const create = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFilesToPayload(req) };
    const result = await createEmployeeProfile(payload);
    return res.status(201).json(result);
  } catch (error) {
    console.error("Employee profile create error:", {
      message: error?.message,
      status: error?.status,
      name: error?.name,
      body: req.body,
    });
    const status = error.status || 500;
    const message = error.status ? error.message : "Employee profile creation failed.";
    return res.status(status).json({ message });
  }
};

const list = async (_req, res) => {
  try {
    const result = await listEmployeeProfiles();
    return res.status(200).json(result);
  } catch (error) {
    console.error("Employee profile list error:", error);
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch employee profiles.";
    return res.status(status).json({ message });
  }
};

const getById = async (req, res) => {
  try {
    const result = await findEmployeeProfileById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch employee profile.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFilesToPayload(req) };
   
    const result = await updateEmployeeProfile(req.params.id, payload);
    
    return res.status(200).json(result);
  } catch (error) {
  
    const status = error.status || 500;
    const message = error.status ? error.message : "Employee profile update failed.";
    return res.status(status).json({ message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await removeEmployeeProfile(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Employee profile delete failed.";
    return res.status(status).json({ message });
  }
};

export { create, list, getById, update, remove };
