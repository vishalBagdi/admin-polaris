import { findEmployeeProfileById } from "../dao/employeeProfile.dao.js";
import {
  createEmployeeDocument,
  deleteEmployeeDocument,
  findEmployeeDocumentById,
  listEmployeeDocuments,
  updateEmployeeDocument,
} from "../dao/employeeDocument.dao.js";
import { getSignedObjectUrl } from "../config/s3.js";

const toPlain = (value) => (value && typeof value.toJSON === "function" ? value.toJSON() : value);

const withSignedUrls = async (document) => {
  const row = toPlain(document);
  if (!row) return row;
  return {
    ...row,
    passbook_front_page_photo_url: await getSignedObjectUrl(row.passbook_front_page_photo_url),
    pan_document_url: await getSignedObjectUrl(row.pan_document_url),
    aadhaar_document_url: await getSignedObjectUrl(row.aadhaar_document_url),
    esi_photo_url: await getSignedObjectUrl(row.esi_photo_url),
    document_url: await getSignedObjectUrl(row.document_url),
  };
};

const create = async ({
  employee_id,
  document_type,
  document_name,
  document_number,
  nominee_relation,
  nominee_name,
  bank_name,
  pan_number,
  aadhaar_number,
  passbook_front_page_photo_url,
  pan_document_url,
  aadhaar_document_url,
  esi_photo_url,
  bank_account_number,
  ifsc_code,
  uan_number,
  pf_account_number,
  issue_date,
  expiry_date,
  document_url,
  notes,
  is_verified,
}) => {
  if (!employee_id) {
    const error = new Error("Employee id is required.");
    error.status = 400;
    throw error;
  }

  const employee = await findEmployeeProfileById(employee_id);
  if (!employee) {
    const error = new Error("Employee profile not found.");
    error.status = 404;
    throw error;
  }

  const created = await createEmployeeDocument({
    employee_id,
    document_type: document_type || "hr_profile",
    document_name: document_name || "HR Profile Data",
    document_number: document_number || null,
    nominee_relation: nominee_relation || null,
    nominee_name: nominee_name || null,
    bank_name: bank_name || null,
    pan_number: pan_number || null,
    aadhaar_number: aadhaar_number || null,
    passbook_front_page_photo_url: passbook_front_page_photo_url || null,
    pan_document_url: pan_document_url || null,
    aadhaar_document_url: aadhaar_document_url || null,
    esi_photo_url: esi_photo_url || null,
    bank_account_number: bank_account_number || null,
    ifsc_code: ifsc_code || null,
    uan_number: uan_number || null,
    pf_account_number: pf_account_number || null,
    issue_date: issue_date || null,
    expiry_date: expiry_date || null,
    document_url: document_url || null,
    notes: notes || null,
    is_verified: typeof is_verified === "boolean" ? is_verified : false,
  });

  return withSignedUrls(created);
};

const listByEmployee = async (employee_id) => {
  if (!employee_id) {
    const error = new Error("Employee id is required.");
    error.status = 400;
    throw error;
  }

  const rows = await listEmployeeDocuments(employee_id);
  return Promise.all((rows || []).map((row) => withSignedUrls(row)));
};

const update = async (id, payload) => {
  if (!id) {
    const error = new Error("Document id is required.");
    error.status = 400;
    throw error;
  }

  const document = await findEmployeeDocumentById(id);
  if (!document) {
    const error = new Error("Employee document not found.");
    error.status = 404;
    throw error;
  }

  await updateEmployeeDocument(id, {
    document_type: payload.document_type ?? document.document_type ?? "hr_profile",
    document_name: payload.document_name ?? document.document_name ?? "HR Profile Data",
    document_number: payload.document_number ?? document.document_number,
    nominee_relation: payload.nominee_relation ?? document.nominee_relation,
    nominee_name: payload.nominee_name ?? document.nominee_name,
    bank_name: payload.bank_name ?? document.bank_name,
    pan_number: payload.pan_number ?? document.pan_number,
    aadhaar_number: payload.aadhaar_number ?? document.aadhaar_number,
    passbook_front_page_photo_url:
      payload.passbook_front_page_photo_url ?? document.passbook_front_page_photo_url,
    pan_document_url: payload.pan_document_url ?? document.pan_document_url,
    aadhaar_document_url: payload.aadhaar_document_url ?? document.aadhaar_document_url,
    esi_photo_url: payload.esi_photo_url ?? document.esi_photo_url,
    bank_account_number: payload.bank_account_number ?? document.bank_account_number,
    ifsc_code: payload.ifsc_code ?? document.ifsc_code,
    uan_number: payload.uan_number ?? document.uan_number,
    pf_account_number: payload.pf_account_number ?? document.pf_account_number,
    issue_date: payload.issue_date ?? document.issue_date,
    expiry_date: payload.expiry_date ?? document.expiry_date,
    document_url: payload.document_url ?? document.document_url,
    notes: payload.notes ?? document.notes,
    is_verified: typeof payload.is_verified === "boolean" ? payload.is_verified : document.is_verified,
  });

  const updated = await findEmployeeDocumentById(id);
  return withSignedUrls(updated);
};

const remove = async (id) => {
  if (!id) {
    const error = new Error("Document id is required.");
    error.status = 400;
    throw error;
  }

  const deleted = await deleteEmployeeDocument(id);
  if (!deleted) {
    const error = new Error("Employee document not found.");
    error.status = 404;
    throw error;
  }

  return { message: "Employee document deleted successfully." };
};

export { create, listByEmployee, update, remove };
