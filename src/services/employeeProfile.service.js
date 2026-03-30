import {
  createEmployeeProfile,
  deleteEmployeeProfile,
  findEmployeeProfileById,
  listEmployeeProfiles,
  updateEmployeeProfile,
} from "../dao/employeeProfile.dao.js";
import {
  createSalary,
  findSalaryByEmployeeAndEffectiveFrom,
  updateSalary,
} from "../dao/salary.dao.js";
import {
  createEmployeeDocument,
  listEmployeeDocuments,
  updateEmployeeDocument,
} from "../dao/employeeDocument.dao.js";
import { getS3KeyFromValue, getSignedObjectUrl } from "../config/s3.js";


const ensureDates = ({ date_of_joining, date_of_exit }) => {
  if (date_of_joining && date_of_exit && new Date(date_of_exit) < new Date(date_of_joining)) {
    const error = new Error("Date of exit (DOE) cannot be before date of joining.");
    error.status = 400;
    throw error;
  }
};


const toMoney = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toInteger = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
};

const toBoolean = (value) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.toLowerCase().trim();
    if (normalized === "true" || normalized === "yes" || normalized === "1") return true;
    if (normalized === "false" || normalized === "no" || normalized === "0") return false;
  }
  return null;
};

const pickValue = (incoming, existing) => {
  if (incoming === undefined || incoming === null) return existing;
  if (typeof incoming === "string" && incoming.trim() === "") return existing;
  return incoming;
};

const normalizeDateOnly = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const text = String(value).trim();
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const toPlain = (value) => (value && typeof value.toJSON === "function" ? value.toJSON() : value);

const latestByDate = (items, key) =>
  (items || [])
    .map(toPlain)
    .filter(Boolean)
    .sort((a, b) => new Date(b?.[key] || 0) - new Date(a?.[key] || 0))[0] || null;

const latestByUpdatedAt = (items) =>
  (items || [])
    .map(toPlain)
    .filter(Boolean)
    .sort((a, b) => new Date(b?.updated_at || b?.created_at || 0) - new Date(a?.updated_at || a?.created_at || 0))[0] ||
  null;

const pickFirstNonEmptyValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => pickFirstNonEmptyValue(item)).find((item) => item !== undefined && item !== null && item !== "");
  }

  if (value === undefined || value === null) return value;
  if (typeof value !== "string") return value;

  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeStoredObjectValue = (value) => {
  const normalizedValue = pickFirstNonEmptyValue(value);
  if (normalizedValue === undefined || normalizedValue === null) return normalizedValue;
  if (typeof normalizedValue !== "string") return normalizedValue;
  return getS3KeyFromValue(normalizedValue) || normalizedValue;
};

const withExportColumns = async (employeeRecord) => {
  const employee = toPlain(employeeRecord);
  if (!employee) return employee;

  const latestSalary = latestByDate(employee.salaries, "effective_from");
  const hrProfileDoc = latestByUpdatedAt(
    (employee.documents || []).filter((doc) => doc?.document_type === "hr_profile")
  );
  const signedPhoto = await getSignedObjectUrl(employee.photo);
  const signedPan = await getSignedObjectUrl(hrProfileDoc?.pan_document_url);
  const signedAadhaar = await getSignedObjectUrl(hrProfileDoc?.aadhaar_document_url);
  const signedEsi = await getSignedObjectUrl(hrProfileDoc?.esi_photo_url);
  const signedPassbook = await getSignedObjectUrl(hrProfileDoc?.passbook_front_page_photo_url);
  const signedDocument = await getSignedObjectUrl(hrProfileDoc?.document_url);

  const signedDocuments = await Promise.all(
    (employee.documents || []).map(async (doc) => {
      const row = toPlain(doc);
      if (!row) return row;
      return {
        ...row,
        passbook_front_page_photo_url: await getSignedObjectUrl(row.passbook_front_page_photo_url),
        pan_document_url: await getSignedObjectUrl(row.pan_document_url),
        aadhaar_document_url: await getSignedObjectUrl(row.aadhaar_document_url),
        esi_photo_url: await getSignedObjectUrl(row.esi_photo_url),
        document_url: await getSignedObjectUrl(row.document_url),
      };
    })
  );

  return {
    ...employee,
    photo: signedPhoto || null,
    profile_photo: signedPhoto || null,
    documents: signedDocuments,
    passbook_front_page_photo_url: signedPassbook || null,
    pan_document_url: signedPan || null,
    aadhaar_document_url: signedAadhaar || null,
    esi_photo_url: signedEsi || null,
    document_url: signedDocument || null,
    uploaded_pan_document_url: signedPan || null,
    uploaded_aadhaar_document_url: signedAadhaar || null,
    uploaded_esi_photo_url: signedEsi || null,
    uploaded_passbook_front_page_photo_url: signedPassbook || null,
    uploaded_document_url: signedDocument || null,
    salary_effective_from: latestSalary?.effective_from || null,
    salary_basic_salary: latestSalary?.basic_salary || null,
    salary_hra: latestSalary?.hra || null,
    salary_ta: latestSalary?.ta || null,
    salary_da: latestSalary?.da || null,
    salary_special_allowance: latestSalary?.special_allowance || null,
    salary_pf: latestSalary?.pf || null,
    salary_pf_number: latestSalary?.pf_number || null,
    salary_esi: latestSalary?.esi || null,
    salary_esi_number: latestSalary?.esi_number || null,
    salary_bonus_once_a_year: latestSalary?.bonus_once_a_year || null,
    salary_advance_loan: latestSalary?.advance_loan ?? null,
    salary_advance_money: latestSalary?.advance_money || null,
    salary_other_perks: latestSalary?.other_perks || null,
    salary_paid_leaves: latestSalary?.paid_leaves ?? null,
    salary_currency: latestSalary?.currency || null,
    salary_payment_frequency: latestSalary?.payment_frequency || null,
  };
};

const upsertSalary = async (employee_id, payload, fallbackDate) => {
  const basic_salary = toMoney(payload.basic_salary);
  const hra = toMoney(payload.hra);
  const ta = toMoney(payload.ta);
  const da = toMoney(payload.da);
  const special_allowance = toMoney(payload.special_allowance);
  const pf = toMoney(payload.pf);
  const esi = toMoney(payload.esi);
  const bonus_once_a_year = toMoney(payload.bonus_once_a_year ?? payload.bonus);
  const advance_money = toMoney(payload.advance_money);
  const other_perks = toMoney(payload.other_perks ?? payload.other_parks);
  const paid_leaves = toInteger(payload.paid_leaves);
  const advance_loan = toBoolean(payload.advance_loan);
  const pf_number = payload.pf_number || null;
  const esi_number = payload.esi_number || null;

  const hasSalaryData = [
    basic_salary,
    hra,
    ta,
    da,
    special_allowance,
    pf,
    pf_number,
    esi,
    esi_number,
    bonus_once_a_year,
    advance_loan,
    advance_money,
    other_perks,
    paid_leaves,
  ].some((value) => value !== null && value !== "");

  if (!hasSalaryData || basic_salary === null) return;

  const effective_from = payload.effective_from || fallbackDate;
  if (!effective_from) return;

  const salaryPayload = {
    employee_id,
    effective_from,
    basic_salary,
    hra: hra ?? 0,
    ta: ta ?? 0,
    da: da ?? 0,
    special_allowance: special_allowance ?? 0,
    pf: pf ?? 0,
    pf_number,
    esi: esi ?? 0,
    esi_number,
    bonus_once_a_year: bonus_once_a_year ?? 0,
    advance_loan: advance_loan ?? false,
    advance_money: advance_money ?? 0,
    other_perks: other_perks ?? 0,
    paid_leaves: paid_leaves ?? 0,
    currency: payload.currency || "USD",
    payment_frequency: payload.payment_frequency || "monthly",
  };

  const existing = await findSalaryByEmployeeAndEffectiveFrom(employee_id, effective_from);
  if (existing) {
    await updateSalary(existing.id, salaryPayload);
    return;
  }

  await createSalary(salaryPayload);
};

const upsertEmployeeDocument = async (employee_id, payload) => {
  const hasDocumentData = [
    payload.bank_account_number,
    payload.account_number,
    payload.ifsc_code,
    payload.bank_name,
    payload.nominee_relation,
    payload.nominee_name,
    payload.passbook_front_page_photo_url,
    payload.pan_number,
    payload.aadhaar_number,
    payload.pan_document_url,
    payload.aadhaar_document_url,
    payload.esi_photo_url,
    payload.document_url,
    payload.pf_account_number,
  ].some((value) => value);

  if (!hasDocumentData) return;

  const existingDocs = await listEmployeeDocuments(employee_id);
  const existing = existingDocs.find((doc) => doc.document_type === "hr_profile");

  const docPayload = {
    employee_id,
    document_type: "hr_profile",
    document_name: "HR Profile Data",
    bank_account_number: pickValue(
      payload.bank_account_number ?? payload.account_number,
      existing?.bank_account_number ?? null
    ),
    ifsc_code: pickValue(payload.ifsc_code, existing?.ifsc_code ?? null),
    bank_name: pickValue(payload.bank_name, existing?.bank_name ?? null),
    nominee_relation: pickValue(payload.nominee_relation, existing?.nominee_relation ?? null),
    nominee_name: pickValue(payload.nominee_name, existing?.nominee_name ?? null),
    passbook_front_page_photo_url: pickValue(
      normalizeStoredObjectValue(payload.passbook_front_page_photo_url),
      existing?.passbook_front_page_photo_url ?? null
    ),
    pan_number: pickValue(payload.pan_number, existing?.pan_number ?? null),
    aadhaar_number: pickValue(payload.aadhaar_number, existing?.aadhaar_number ?? null),
    pan_document_url: pickValue(
      normalizeStoredObjectValue(payload.pan_document_url),
      existing?.pan_document_url ?? null
    ),
    aadhaar_document_url: pickValue(
      normalizeStoredObjectValue(payload.aadhaar_document_url),
      existing?.aadhaar_document_url ?? null
    ),
    esi_photo_url: pickValue(
      normalizeStoredObjectValue(payload.esi_photo_url),
      existing?.esi_photo_url ?? null
    ),
    document_url: pickValue(
      normalizeStoredObjectValue(payload.document_url),
      existing?.document_url ?? null
    ),
    pf_account_number: pickValue(
      payload.pf_account_number ?? payload.pf_number,
      existing?.pf_account_number ?? null
    ),
    uan_number: pickValue(payload.uan_number, existing?.uan_number ?? null),
    notes: pickValue(payload.notes, existing?.notes ?? null),
    is_verified: false,
  };
  if (existing) {
    await updateEmployeeDocument(existing.id, docPayload);
    return;
  }

  await createEmployeeDocument(docPayload);
};

const create = async (payload) => {
  const {
    code,
    full_name,
    first_name,
    last_name,
    spouse_name,
    phone,
    mobile_number,
    alternative_mobile_number,
    emergency_contact_number,
    department,
    designation,
    date_of_joining,
    date_of_birth,
    date_of_exit,
    date_of_releasing,
    photo,
    employment_type,
    gender,
    marital_status,
    blood_group,
    qualification,
    nationality,
    personal_email,
    email_id,
    current_address,
    permanent_address,
    manager_name,
    probation_end_date,
    bank_name,
    bank_account_number,
    ifsc_code,
    pan_number,
    aadhaar_number,
    passport_no,
    is_active,
    emergency_contact_name,
    emergency_contact_phone,
    account_number,
  } = payload;

  const normalizedFullName = full_name || `${first_name || ""} ${last_name || ""}`.trim();
  const normalizedCode = typeof code === "string" && code.trim() ? code.trim() : null;
  const normalizedDesignation =
    typeof designation === "string" && designation.trim() ? designation.trim() : "Not Assigned";
  const normalizedPhone = phone || mobile_number || null;
  const normalizedPersonalEmail = personal_email || email_id || null;
  const normalizedBankAccountNumber = bank_account_number || account_number || null;
  const normalizedDateOfJoining = normalizeDateOnly(date_of_joining);
  const normalizedDateOfBirth = normalizeDateOnly(date_of_birth);
  const normalizedDateOfExit = normalizeDateOnly(date_of_exit);
  const normalizedDateOfReleasing = normalizeDateOnly(date_of_releasing);
  const normalizedProbationEndDate = normalizeDateOnly(probation_end_date);

  if (!normalizedFullName || !department || !normalizedDateOfJoining) {
    const error = new Error("Full name, department, and date of joining are required.");
    error.status = 400;
    throw error;
  }

  ensureDates({ date_of_joining: normalizedDateOfJoining, date_of_exit: normalizedDateOfExit });

  const employee = await createEmployeeProfile({
    code: normalizedCode,
    full_name: normalizedFullName,
    spouse_name: spouse_name || null,
    phone: normalizedPhone,
    alternative_mobile_number: alternative_mobile_number || null,
    emergency_contact_number: emergency_contact_number || null,
    department,
    designation: normalizedDesignation,
    date_of_joining: normalizedDateOfJoining,
    date_of_birth: normalizedDateOfBirth,
    date_of_exit: normalizedDateOfExit,
    date_of_releasing: normalizedDateOfReleasing,
    photo: photo || null,
    employment_type: employment_type || "full_time",
    gender: gender || null,
    marital_status: marital_status || null,
    blood_group: blood_group || null,
    qualification: qualification || null,
    nationality: nationality || null,
    personal_email: normalizedPersonalEmail,
    current_address: current_address || null,
    permanent_address: permanent_address || null,
    manager_name: manager_name || null,
    probation_end_date: normalizedProbationEndDate,
    bank_name: bank_name || null,
    bank_account_number: normalizedBankAccountNumber,
    ifsc_code: ifsc_code || null,
    pan_number: pan_number || null,
    aadhaar_number: aadhaar_number || null,
    passport_no: passport_no || null,
    is_active: typeof is_active === "boolean" ? is_active : true,
    emergency_contact_name: emergency_contact_name || null,
    emergency_contact_phone: emergency_contact_phone || null,
  });

  await upsertSalary(employee.id, payload, normalizedDateOfJoining);
  await upsertEmployeeDocument(employee.id, payload);

  return withExportColumns(await findEmployeeProfileById(employee.id));
};

const list = async () => {
  const employees = await listEmployeeProfiles();
  return Promise.all(employees.map((employee) => withExportColumns(employee)));
};

const findById = async (id) => {
  const employee = await findEmployeeProfileById(id);
  if (!employee) {
    const error = new Error("Employee profile not found.");
    error.status = 404;
    throw error;
  }

  return withExportColumns(employee);
};

const update = async (id, payload) => {
  if (!id) {
    const error = new Error("Employee id is required.");
    error.status = 400;
    throw error;
  }

  const employee = await findEmployeeProfileById(id);
  if (!employee) {
    const error = new Error("Employee profile not found.");
    error.status = 404;
    throw error;
  }

  const date_of_joining = pickValue(
    normalizeDateOnly(payload.date_of_joining),
    employee.date_of_joining
  );
  const date_of_exit = pickValue(normalizeDateOnly(payload.date_of_exit), employee.date_of_exit);
  const fullNameFromParts =
    payload.first_name || payload.last_name
      ? `${payload.first_name || ""} ${payload.last_name || ""}`.trim()
      : undefined;
  const normalizedFullName = pickValue(
    payload.full_name ?? fullNameFromParts,
    employee.full_name
  );
  const normalizedPhone = pickValue(payload.phone ?? payload.mobile_number, employee.phone);
  const normalizedPersonalEmail = pickValue(
    payload.personal_email ?? payload.email_id,
    employee.personal_email
  );
  const normalizedBankAccountNumber = pickValue(
    payload.bank_account_number ?? payload.account_number,
    employee.bank_account_number
  );
  ensureDates({ date_of_joining, date_of_exit });

  await updateEmployeeProfile(id, {
    code: pickValue(payload.code, employee.code),
    full_name: normalizedFullName,
    spouse_name: pickValue(payload.spouse_name, employee.spouse_name),
    phone: normalizedPhone,
    alternative_mobile_number: pickValue(
      payload.alternative_mobile_number,
      employee.alternative_mobile_number
    ),
    emergency_contact_number: pickValue(
      payload.emergency_contact_number,
      employee.emergency_contact_number
    ),
    department: pickValue(payload.department, employee.department),
    designation: pickValue(payload.designation, employee.designation),
    date_of_joining,
    date_of_birth: pickValue(normalizeDateOnly(payload.date_of_birth), employee.date_of_birth),
    date_of_exit,
    date_of_releasing: pickValue(
      normalizeDateOnly(payload.date_of_releasing),
      employee.date_of_releasing
    ),
    photo: pickValue(payload.photo, employee.photo),
    employment_type: pickValue(payload.employment_type, employee.employment_type),
    gender: pickValue(payload.gender, employee.gender),
    marital_status: pickValue(payload.marital_status, employee.marital_status),
    blood_group: pickValue(payload.blood_group, employee.blood_group),
    qualification: pickValue(payload.qualification, employee.qualification),
    nationality: pickValue(payload.nationality, employee.nationality),
    personal_email: normalizedPersonalEmail,
    current_address: pickValue(payload.current_address, employee.current_address),
    permanent_address: pickValue(payload.permanent_address, employee.permanent_address),
    manager_name: pickValue(payload.manager_name, employee.manager_name),
    probation_end_date: pickValue(
      normalizeDateOnly(payload.probation_end_date),
      employee.probation_end_date
    ),
    bank_name: pickValue(payload.bank_name, employee.bank_name),
    bank_account_number: normalizedBankAccountNumber,
    ifsc_code: pickValue(payload.ifsc_code, employee.ifsc_code),
    pan_number: pickValue(payload.pan_number, employee.pan_number),
    aadhaar_number: pickValue(payload.aadhaar_number, employee.aadhaar_number),
    passport_no: pickValue(payload.passport_no, employee.passport_no),
    is_active: typeof payload.is_active === "boolean" ? payload.is_active : employee.is_active,
    emergency_contact_name: pickValue(
      payload.emergency_contact_name,
      employee.emergency_contact_name
    ),
    emergency_contact_phone: pickValue(
      payload.emergency_contact_phone,
      employee.emergency_contact_phone
    ),
  });

  await upsertSalary(id, payload, date_of_joining);
  await upsertEmployeeDocument(id, payload);

  return withExportColumns(await findEmployeeProfileById(id));
};

const remove = async (id) => {
  if (!id) {
    const error = new Error("Employee id is required.");
    error.status = 400;
    throw error;
  }

  const employee = await findEmployeeProfileById(id);
  if (!employee) {
    const error = new Error("Employee profile not found.");
    error.status = 404;
    throw error;
  }

  await deleteEmployeeProfile(id);
  return { message: "Employee profile deleted successfully." };
};

export { create, list, findById, update, remove };
