import {
  createAttendance,
  createAttendanceEditLog,
  findAttendanceById,
  findAttendancesByCodeAndDate,
  listAttendances,
  listAttendanceEditLogs,
  updateAttendance,
  updateAttendancesByCodeAndDate,
} from "../dao/attendance.dao.js";
import {
  findEmployeeProfileByCode,
  listActiveEmployeeProfilesForAttendance,
} from "../dao/employeeProfile.dao.js";

const getCurrentAttendanceDate = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.ATTENDANCE_TIMEZONE || process.env.TZ || "Asia/Kolkata",
  }).format(new Date());

const create = async ({
  code,
  attendance_date,
  punch_time,
  status,
  remarks,
}) => {
  const normalizedCode = code;
  if (!normalizedCode || !attendance_date || !punch_time) {
    const error = new Error("Employee code, attendance date and punch time are required.");
    error.status = 400;
    throw error;
  }

  const employee = await findEmployeeProfileByCode(normalizedCode);
  if (!employee) {
    const error = new Error("Employee profile not found.");
    error.status = 404;
    throw error;
  }

  return createAttendance({
    code: normalizedCode,
    attendance_date,
    punch_time,
    status: status || "present",
    remarks: remarks || null,
  });
};

const formatTotalHours = (totalSeconds, punchCount) => {
  if (!Number.isFinite(totalSeconds) || Number(punchCount) < 2) {
    return "00:00";
  }

  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getMinPunchOutGapSeconds = () => {
  const configuredMinutes = Number.parseInt(String(process.env.ATTENDANCE_MIN_OUT_GAP_MINUTES ?? "30"), 10);
  const normalizedMinutes = Number.isFinite(configuredMinutes) && configuredMinutes >= 0
    ? configuredMinutes
    : 30;
  return normalizedMinutes * 60;
};

const toSeconds = (timeValue) => {
  const [hour, minute, second] = String(timeValue || "").split(":").map((value) => Number(value));
  if (![hour, minute, second].every(Number.isFinite)) {
    return null;
  }
  return (hour * 3600) + (minute * 60) + second;
};

const calculatePairedTotalSeconds = (punchTimes) => {
  if (!Array.isArray(punchTimes) || punchTimes.length < 2) {
    return {
      totalSeconds: 0,
      firstPunchIn: punchTimes?.[0] || null,
      lastPunchOut: null,
      pairCount: 0,
    };
  }

  const sorted = [...punchTimes].sort((a, b) => String(a).localeCompare(String(b)));
  const firstPunchIn = sorted[0] || null;
  const lastPunchOut = sorted[sorted.length - 1] || null;
  const firstPunchInSeconds = toSeconds(firstPunchIn);
  const lastPunchOutSeconds = toSeconds(lastPunchOut);

  if (
    !Number.isFinite(firstPunchInSeconds) ||
    !Number.isFinite(lastPunchOutSeconds) ||
    lastPunchOutSeconds <= firstPunchInSeconds
  ) {
    return {
      totalSeconds: 0,
      firstPunchIn,
      lastPunchOut: null,
      pairCount: 0,
    };
  }

  const totalSeconds = lastPunchOutSeconds - firstPunchInSeconds;
  const pairCount = totalSeconds >= getMinPunchOutGapSeconds() ? 1 : 0;

  return {
    totalSeconds,
    firstPunchIn,
    lastPunchOut: pairCount > 0 ? lastPunchOut : null,
    pairCount,
  };
};

const normalizePagination = ({ page, limit }) => {
  const parsedPage = Number.parseInt(String(page ?? ""), 10);
  const parsedLimit = Number.parseInt(String(limit ?? ""), 10);
  const hasPage = Number.isFinite(parsedPage) && parsedPage > 0;
  const hasLimit = Number.isFinite(parsedLimit) && parsedLimit > 0;

  if (!hasPage && !hasLimit) {
    return { enabled: false, page: null, limit: null };
  }

  const normalizedPage = hasPage ? parsedPage : 1;
  const normalizedLimit = hasLimit ? Math.min(parsedLimit, 200) : 20;

  return { enabled: true, page: normalizedPage, limit: normalizedLimit };
};

const normalizeStatusFilter = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "all") {
    return null;
  }
  return normalized;
};

const normalizeSearchFilter = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized || null;
};

const toDateOnlyString = (value) => {
  if (!value) return null;
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return text;
  }
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return parsed.toISOString().slice(0, 10);
};

const listDateRange = (fromDate, toDate) => {
  const from = toDateOnlyString(fromDate);
  const to = toDateOnlyString(toDate);
  if (!from || !to) {
    return [];
  }

  const dates = [];
  const cursor = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T00:00:00.000Z`);

  while (cursor <= end) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const matchesAttendanceSearch = (row, search) => {
  if (!search) {
    return true;
  }

  const code = String(row?.code ?? "").toLowerCase();
  const fullName = String(row?.employee_profile?.full_name ?? "").toLowerCase();
  return code.includes(search) || fullName.includes(search);
};

const normalizeTimeValue = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;

  const twelveHourMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AaPp][Mm])$/);
  const twentyFourHourMatch = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);

  let hours;
  let minutes;
  let seconds;

  if (twelveHourMatch) {
    hours = Number(twelveHourMatch[1]);
    minutes = Number(twelveHourMatch[2]);
    seconds = Number(twelveHourMatch[3] ?? "0");

    if (hours < 1 || hours > 12) {
      return null;
    }

    const meridiem = twelveHourMatch[4].toUpperCase();
    if (meridiem === "AM") {
      hours = hours === 12 ? 0 : hours;
    } else {
      hours = hours === 12 ? 12 : hours + 12;
    }
  } else if (twentyFourHourMatch) {
    hours = Number(twentyFourHourMatch[1]);
    minutes = Number(twentyFourHourMatch[2]);
    seconds = Number(twentyFourHourMatch[3] ?? "0");
  } else {
    return null;
  }

  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(minutes) ||
    !Number.isFinite(seconds) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59 ||
    seconds < 0 ||
    seconds > 59
  ) {
    return null;
  }

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const buildAttendanceSummaryRows = (rawRows) => {
  const groupedByDay = new Map();

  for (const row of rawRows) {
    const key = `${row.code}::${row.attendance_date}`;
    if (!groupedByDay.has(key)) {
      groupedByDay.set(key, {
        code: row.code,
        attendance_date: row.attendance_date,
        punch_times: [],
        edit_entry_id: Number(row.id),
        remarks: row.remarks || null,
        employee_profile: row.employee_profile
          ? {
              id: row.employee_profile.id,
              code: row.employee_profile.code,
              full_name: row.employee_profile.full_name,
              department: row.employee_profile.department,
              designation: row.employee_profile.designation,
              photo: row.employee_profile.photo,
            }
          : null,
      });
    }

    const group = groupedByDay.get(key);
    group.punch_times.push(row.punch_time);
    if (Number(row.id) > group.edit_entry_id) {
      group.edit_entry_id = Number(row.id);
    }
    if (!group.remarks && row.remarks) {
      group.remarks = row.remarks;
    }
    if (!group.employee_profile && row.employee_profile) {
      group.employee_profile = {
        id: row.employee_profile.id,
        code: row.employee_profile.code,
        full_name: row.employee_profile.full_name,
        department: row.employee_profile.department,
        designation: row.employee_profile.designation,
        photo: row.employee_profile.photo,
      };
    }
  }

  return [...groupedByDay.values()]
    .map((group) => {
      const sortedPunchTimes = [...group.punch_times].sort((a, b) => String(a).localeCompare(String(b)));
      const punchCount = sortedPunchTimes.length;
      const pairSummary = calculatePairedTotalSeconds(sortedPunchTimes);
      const dayStatus = punchCount > 0 ? "present" : "absent";

      return {
        code: group.code,
        attendance_date: group.attendance_date,
        punch_in_time: pairSummary.firstPunchIn,
        punch_out_time: pairSummary.lastPunchOut,
        total_hours: formatTotalHours(pairSummary.totalSeconds, punchCount),
        status: dayStatus,
        punch_count: punchCount,
        edit_entry_id: group.edit_entry_id,
        remarks: group.remarks,
        employee_profile: group.employee_profile,
      };
    })
    .sort((a, b) => {
      if (a.attendance_date === b.attendance_date) {
        return String(a.code).localeCompare(String(b.code));
      }
      return String(b.attendance_date).localeCompare(String(a.attendance_date));
    });
};

const buildAbsentSummaryRows = async ({ code, from_date, to_date, existingRows }) => {
  const employees = (await listActiveEmployeeProfilesForAttendance({ code }))
    .filter((employee) => String(employee?.code ?? "").trim().length > 0)
    .map((employee) => ({
      id: employee.id,
      code: String(employee.code),
      full_name: employee.full_name,
      department: employee.department,
      designation: employee.designation,
      photo: employee.photo,
    }));

  if (!employees.length) {
    return [];
  }

  const dates = listDateRange(from_date, to_date);
  if (!dates.length) {
    return [];
  }

  const existingKeys = new Set(
    existingRows.map((row) => `${String(row.code)}::${String(row.attendance_date)}`)
  );

  const absentRows = [];
  for (const attendanceDate of dates) {
    for (const employee of employees) {
      const key = `${employee.code}::${attendanceDate}`;
      if (existingKeys.has(key)) {
        continue;
      }

      absentRows.push({
        code: employee.code,
        attendance_date: attendanceDate,
        punch_in_time: null,
        punch_out_time: null,
        total_hours: "00:00",
        status: "absent",
        punch_count: 0,
        edit_entry_id: null,
        remarks: null,
        employee_profile: employee,
      });
    }
  }

  return absentRows;
};

const serializeSummaryRowForLog = (row, fallback = {}) => ({
  attendance_id: Number(row?.edit_entry_id ?? fallback.attendance_id ?? 0),
  code: String(row?.code ?? fallback.code ?? ""),
  attendance_date: String(row?.attendance_date ?? fallback.attendance_date ?? ""),
  punch_in_time: row?.punch_in_time ?? fallback.punch_in_time ?? null,
  punch_out_time: row?.punch_out_time ?? fallback.punch_out_time ?? null,
  total_hours: row?.total_hours ?? fallback.total_hours ?? null,
  status: row?.status ?? fallback.status ?? null,
  remarks: row?.remarks ?? fallback.remarks ?? null,
});

const createAuditLog = async ({ before, after, actor }) => {
  const previous = serializeSummaryRowForLog(before);
  const next = serializeSummaryRowForLog(after, previous);

  if (!next.attendance_id || !next.code || !next.attendance_date) {
    return null;
  }

  return createAttendanceEditLog({
    attendance_id: next.attendance_id,
    code: next.code,
    attendance_date: next.attendance_date,
    old_punch_in_time: previous.punch_in_time,
    new_punch_in_time: next.punch_in_time,
    old_punch_out_time: previous.punch_out_time,
    new_punch_out_time: next.punch_out_time,
    old_total_hours: previous.total_hours,
    new_total_hours: next.total_hours,
    old_status: previous.status,
    new_status: next.status,
    old_remarks: previous.remarks,
    new_remarks: next.remarks,
    updated_by_user_id: actor?.id ?? null,
    updated_by_name: actor?.name ?? actor?.email ?? null,
  });
};

const list = async ({
  code,
  from_date,
  to_date,
  start_date,
  end_date,
  view,
  page,
  limit,
  status,
  search,
}) => {
  const pagination = normalizePagination({ page, limit });
  const normalizedStatus = normalizeStatusFilter(status);
  const normalizedSearch = normalizeSearchFilter(search);
  const normalizedFromDate = from_date || start_date || to_date || end_date || getCurrentAttendanceDate();
  const normalizedToDate = to_date || end_date || from_date || start_date || getCurrentAttendanceDate();

  if (view === "raw") {
    const shouldFilterInMemory = Boolean(normalizedSearch);
    const rawResult = await listAttendances({
      code,
      from_date: normalizedFromDate,
      to_date: normalizedToDate,
      status: normalizedStatus,
      page: pagination.enabled && !shouldFilterInMemory ? pagination.page : undefined,
      limit: pagination.enabled && !shouldFilterInMemory ? pagination.limit : undefined,
    });

    const rawRows = pagination.enabled && !shouldFilterInMemory
      ? (rawResult?.rows || [])
      : rawResult;
    const filteredRawRows = rawRows.filter((row) => matchesAttendanceSearch(row, normalizedSearch));

    if (!pagination.enabled) {
      return filteredRawRows;
    }

    if (!shouldFilterInMemory) {
      const total = Number(rawResult?.count || 0);
      const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

      return {
        data: filteredRawRows,
        pagination: {
          page: Math.min(pagination.page, totalPages),
          limit: pagination.limit,
          total,
          total_pages: totalPages,
        },
      };
    }

    const pagedRows = filteredRawRows.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit);
    const total = filteredRawRows.length;
    const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

    return {
      data: pagedRows,
      pagination: {
        page: Math.min(pagination.page, totalPages),
        limit: pagination.limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  const rawRows = await listAttendances({
    code,
    from_date: normalizedFromDate,
    to_date: normalizedToDate,
  });
  const summaryRows = buildAttendanceSummaryRows(rawRows);
  const absentRows = await buildAbsentSummaryRows({
    code,
    from_date: normalizedFromDate,
    to_date: normalizedToDate,
    existingRows: summaryRows,
  });
  const allSummaryRows = [...summaryRows, ...absentRows].sort((a, b) => {
    if (a.attendance_date === b.attendance_date) {
      return String(a.code).localeCompare(String(b.code));
    }
    return String(b.attendance_date).localeCompare(String(a.attendance_date));
  });

  const filteredSummaryRows = normalizedStatus
    ? allSummaryRows.filter((row) => String(row.status || "").toLowerCase() === normalizedStatus)
    : allSummaryRows;
  const searchedSummaryRows = filteredSummaryRows.filter((row) => matchesAttendanceSearch(row, normalizedSearch));

  if (!searchedSummaryRows.length) {
    if (pagination.enabled) {
      return {
        data: [],
        pagination: {
          page: 1,
          limit: pagination.limit,
          total: 0,
          total_pages: 1,
        },
      };
    }
    return [];
  }

  const rowsForOutput = pagination.enabled
    ? searchedSummaryRows.slice((pagination.page - 1) * pagination.limit, pagination.page * pagination.limit)
    : searchedSummaryRows;

  const mappedRows = rowsForOutput.map((row) => ({
    code: row.code,
    attendance_date: row.attendance_date,
    punch_in_time: row.punch_in_time,
    punch_out_time: row.punch_out_time,
    total_hours: row.total_hours,
    status: row.status,
    punch_count: row.punch_count,
    edit_entry_id: Number(row.edit_entry_id),
    remarks: row.remarks || null,
    employee_profile: row.employee_profile || null,
  }));

  if (!pagination.enabled) {
    return mappedRows;
  }

  const total = searchedSummaryRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pagination.limit));

  return {
    data: mappedRows,
    pagination: {
      page: Math.min(pagination.page, totalPages),
      limit: pagination.limit,
      total,
      total_pages: totalPages,
    },
  };
};

const update = async (id, payload, actor = null) => {
  if (!id) {
    const error = new Error("Attendance id is required.");
    error.status = 400;
    throw error;
  }

  const attendance = await findAttendanceById(id);
  if (!attendance) {
    const error = new Error("Attendance record not found.");
    error.status = 404;
    throw error;
  }

  const normalizedPunchIn = normalizeTimeValue(payload.punch_in_time);
  const normalizedPunchOut = normalizeTimeValue(payload.punch_out_time);
  const isSummaryTimeUpdate = Boolean(payload.punch_in_time || payload.punch_out_time);

  if (isSummaryTimeUpdate) {
    if (!normalizedPunchIn || !normalizedPunchOut) {
      const error = new Error("Punch in time and punch out time are required in HH:MM format.");
      error.status = 400;
      throw error;
    }
    if (toSeconds(normalizedPunchOut) <= toSeconds(normalizedPunchIn)) {
      const error = new Error("Punch out time must be after punch in time.");
      error.status = 400;
      throw error;
    }

    const existingRows = await findAttendancesByCodeAndDate({
      code: attendance.code,
      attendance_date: attendance.attendance_date,
    });

    if (!existingRows.length) {
      const error = new Error("Attendance records for this day were not found.");
      error.status = 404;
      throw error;
    }

    const [beforeSummaryRow] = buildAttendanceSummaryRows(existingRows);
    const firstRow = existingRows[0];
    const lastRow = existingRows[existingRows.length - 1];
    const nextStatus = payload.status ?? attendance.status ?? "present";
    const nextRemarks = payload.remarks ?? attendance.remarks ?? null;

    await updateAttendancesByCodeAndDate(
      { code: attendance.code, attendance_date: attendance.attendance_date },
      {
        status: nextStatus,
        remarks: nextRemarks,
      }
    );

    await updateAttendance(firstRow.id, {
      punch_time: normalizedPunchIn,
    });

    if (lastRow.id === firstRow.id) {
      if (normalizedPunchOut !== normalizedPunchIn) {
        await createAttendance({
          code: attendance.code,
          attendance_date: attendance.attendance_date,
          punch_time: normalizedPunchOut,
          status: nextStatus,
          remarks: nextRemarks,
        });
      }
    } else {
      await updateAttendance(lastRow.id, {
        punch_time: normalizedPunchOut,
      });
    }

    const refreshedRows = await findAttendancesByCodeAndDate({
      code: attendance.code,
      attendance_date: attendance.attendance_date,
    });
    const [summaryRow] = buildAttendanceSummaryRows(refreshedRows);
    await createAuditLog({ before: beforeSummaryRow, after: summaryRow, actor });
    return summaryRow || null;
  }

  const beforeSingleRows = await findAttendancesByCodeAndDate({
    code: attendance.code,
    attendance_date: attendance.attendance_date,
  });
  const [beforeSingleSummaryRow] = buildAttendanceSummaryRows(beforeSingleRows);

  await updateAttendance(id, {
    attendance_date: payload.attendance_date ?? attendance.attendance_date,
    punch_time: normalizeTimeValue(payload.punch_time) ?? attendance.punch_time,
    status: payload.status ?? attendance.status,
    remarks: payload.remarks ?? attendance.remarks,
  });

  const updatedRows = await findAttendancesByCodeAndDate({
    code: attendance.code,
    attendance_date: payload.attendance_date ?? attendance.attendance_date,
  });
  const matchedSummaryRow =
    buildAttendanceSummaryRows(updatedRows).find(
      (row) =>
        String(row.code) === String(attendance.code) &&
        String(row.attendance_date) === String(payload.attendance_date ?? attendance.attendance_date)
    ) || null;

  await createAuditLog({ before: beforeSingleSummaryRow, after: matchedSummaryRow, actor });

  return matchedSummaryRow || findAttendanceById(id);
};

const listEditLogs = async ({ code, attendance_date, attendance_id, limit }) =>
  listAttendanceEditLogs({ code, attendance_date, attendance_id, limit });

export { create, list, update, listEditLogs };
