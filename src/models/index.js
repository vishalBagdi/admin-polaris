import sequelize from "../config/database.js";
import defineUser from "./user.model.js";
import defineRole from "./role.model.js";
import defineEmployeeProfile from "./employeeProfile.model.js";
import defineAttendance from "./attendance.model.js";
import defineAttendanceEditLog from "./attendanceEditLog.model.js";
import defineSalary from "./salary.model.js";
import defineLeaveRequest from "./leaveRequest.model.js";
import defineEmployeeDocument from "./employeeDocument.model.js";
import defineCategory from "./category.model.js";
import defineSubcategory from "./subcategory.model.js";

const models = {
  User: defineUser(sequelize),
  Role: defineRole(sequelize),
  EmployeeProfile: defineEmployeeProfile(sequelize),
  Attendance: defineAttendance(sequelize),
  AttendanceEditLog: defineAttendanceEditLog(sequelize),
  Salary: defineSalary(sequelize),
  LeaveRequest: defineLeaveRequest(sequelize),
  EmployeeDocument: defineEmployeeDocument(sequelize),
  Category: defineCategory(sequelize),
  Subcategory: defineSubcategory(sequelize),
};

models.User.belongsTo(models.Role, { foreignKey: "role_id", as: "role" });
models.Role.hasMany(models.User, { foreignKey: "role_id", as: "users" });

models.Attendance.belongsTo(models.EmployeeProfile, {
  foreignKey: "code",
  targetKey: "code",
  as: "employee_profile",
});
models.EmployeeProfile.hasMany(models.Attendance, {
  foreignKey: "code",
  sourceKey: "code",
  as: "attendances",
});

models.AttendanceEditLog.belongsTo(models.Attendance, {
  foreignKey: "attendance_id",
  as: "attendance",
});
models.Attendance.hasMany(models.AttendanceEditLog, {
  foreignKey: "attendance_id",
  as: "edit_logs",
});

models.AttendanceEditLog.belongsTo(models.User, {
  foreignKey: "updated_by_user_id",
  as: "updated_by_user",
});
models.User.hasMany(models.AttendanceEditLog, {
  foreignKey: "updated_by_user_id",
  as: "attendance_edit_logs",
});

models.Salary.belongsTo(models.EmployeeProfile, { foreignKey: "employee_id", as: "employee_profile" });
models.EmployeeProfile.hasMany(models.Salary, { foreignKey: "employee_id", as: "salaries" });

models.LeaveRequest.belongsTo(models.EmployeeProfile, {
  foreignKey: "employee_id",
  as: "employee_profile",
});
models.EmployeeProfile.hasMany(models.LeaveRequest, {
  foreignKey: "employee_id",
  as: "leave_requests",
});

models.EmployeeDocument.belongsTo(models.EmployeeProfile, {
  foreignKey: "employee_id",
  as: "employee_profile",
});
models.EmployeeProfile.hasMany(models.EmployeeDocument, {
  foreignKey: "employee_id",
  as: "documents",
});

models.Subcategory.belongsTo(models.Category, {
  foreignKey: "category_id",
  as: "category",
});
models.Category.hasMany(models.Subcategory, {
  foreignKey: "category_id",
  as: "subcategories",
});

export const { User, Role, EmployeeProfile, Attendance, AttendanceEditLog, Salary, LeaveRequest, EmployeeDocument, Category, Subcategory } =
  models;
export { sequelize };
