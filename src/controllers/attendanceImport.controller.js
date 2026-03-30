import { bulkCreateAttendances, findAttendancesForImport } from "../dao/attendance.dao.js";

const DATETIME_PATTERN = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.\d+)?$/;

const parsePunchDateTime = (value) => {
  const raw = String(value || "").trim();
  const match = raw.match(DATETIME_PATTERN);
  if (!match) {
    return null;
  }
  return { attendance_date: match[1], punch_time: match[2] };
};

const importLogs = async (req, res) => {
  try {
    const apiKey = req.headers["x-api-key"];
    if (!process.env.ATTENDANCE_API_KEY || apiKey !== process.env.ATTENDANCE_API_KEY) {
      return res.status(401).json({ message: "Unauthorized API key." });
    }

    const payload = req.body;
    const rows = Array.isArray(payload) ? payload : payload?.rows || payload?.punches || [];
    
    const receivedRows = Array.isArray(rows) ? rows.length : 0;
    const uniqueDays = [...new Set(
      rows
        .map((row) => String(row?.punchTime ?? row?.punch_time ?? "").trim())
        .filter(Boolean)
        .map((value) => value.split(/[ T]/)[0]),
    )];

    if (!Array.isArray(rows) || receivedRows === 0) {
      return res.status(400).json({ message: "No attendance rows provided." });
    }

    const normalizedRows = [];
    const invalidRows = [];
    for (const [index, row] of rows.entries()) {
      const code = String(row?.employeeCode ?? row?.code ?? "").trim();
      const parsed = parsePunchDateTime(row?.punchTime ?? row?.punch_time);
      if (!code || !parsed) {
        invalidRows.push(index);
        continue;
      }

      normalizedRows.push({
        code,
        attendance_date: parsed.attendance_date,
        punch_time: parsed.punch_time,
        status: "present",
        remarks: null,
      });
    }

    if (normalizedRows.length === 0) {
      return res.status(400).json({
        message: "No valid attendance rows after parsing.",
        invalidRows,
      });
    }

    const recordsForInsert = normalizedRows;

    const existingRows = await findAttendancesForImport({
      codes: [...new Set(recordsForInsert.map((row) => row.code))],
      attendanceDates: [...new Set(recordsForInsert.map((row) => row.attendance_date))],
    });
    const existingKeySet = new Set(existingRows.map((row) => `${row.code}::${row.attendance_date}::${row.punch_time}`));

    const payloadUniqueMap = new Map();
    for (const row of recordsForInsert) {
      const key = `${row.code}::${row.attendance_date}::${row.punch_time}`;
      if (!payloadUniqueMap.has(key) && !existingKeySet.has(key)) {
        payloadUniqueMap.set(key, row);
      }
    }

    const recordsToInsert = [...payloadUniqueMap.values()];
    const inserted = recordsToInsert.length > 0 ? await bulkCreateAttendances(recordsToInsert) : [];

    return res.status(200).json({
      message: "Attendance logs imported.",
      totalRows: receivedRows,
      checkedRows: receivedRows,
      validRows: normalizedRows.length,
      processedAllRows: true,
      insertedRows: inserted.length,
      skippedDuplicateRows: recordsForInsert.length - recordsToInsert.length,
      skippedInvalidRows: invalidRows.length,
      invalidRowIndexes: invalidRows,
    });
  } catch (error) {
    console.error("[attendance-import] failed", error);
    return res.status(500).json({ message: "Attendance import failed." });
  }
};

export { importLogs };
