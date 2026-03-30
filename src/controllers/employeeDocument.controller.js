import {
  create as createEmployeeDocument,
  listByEmployee,
  remove as removeEmployeeDocument,
  update as updateEmployeeDocument,
} from "../services/employeeDocument.service.js";

const mapFilesToPayload = (req) => {
  const files = req.files || {};
  const toStoredPath = (entry) => {
    const file = Array.isArray(entry) ? entry[0] : entry;
    if (!file) return null;
    return file.location || (file.filename ? `/storage/employee-documents/${file.filename}` : null);
  };

  const mapped = {};
  const panFilePath = toStoredPath(files.panFile);
  const aadhaarFilePath = toStoredPath(files.aadhaarFile);
  const passbookPath = toStoredPath(files.passbookFrontPagePhoto);
  const esiPhotoPath = toStoredPath(files.esiPhoto);
  const documentPath = toStoredPath(files.documentFile);

  if (panFilePath) mapped.pan_document_url = panFilePath;
  if (aadhaarFilePath) mapped.aadhaar_document_url = aadhaarFilePath;
  if (esiPhotoPath) mapped.esi_photo_url = esiPhotoPath;
  if (passbookPath) mapped.passbook_front_page_photo_url = passbookPath;
  if (documentPath) mapped.document_url = documentPath;

  return mapped;
};

const create = async (req, res) => {
  try {
    const result = await createEmployeeDocument({
      ...(req.body || {}),
      ...mapFilesToPayload(req),
      employee_id: req.params.employee_id,
    });
    return res.status(201).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Employee document creation failed.";
    return res.status(status).json({ message });
  }
};

const list = async (req, res) => {
  try {
    const result = await listByEmployee(req.params.employee_id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Failed to fetch employee documents.";
    return res.status(status).json({ message });
  }
};

const update = async (req, res) => {
  try {
    const payload = { ...(req.body || {}), ...mapFilesToPayload(req) };
    const result = await updateEmployeeDocument(req.params.id, payload);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Employee document update failed.";
    return res.status(status).json({ message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await removeEmployeeDocument(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    const status = error.status || 500;
    const message = error.status ? error.message : "Employee document delete failed.";
    return res.status(status).json({ message });
  }
};

export { create, list, update, remove };
