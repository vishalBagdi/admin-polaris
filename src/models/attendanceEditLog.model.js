import { DataTypes } from "sequelize";

const defineAttendanceEditLog = (sequelize) => {
  const AttendanceEditLog = sequelize.define(
    "AttendanceEditLog",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      attendance_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      old_punch_in_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      new_punch_in_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      old_punch_out_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      new_punch_out_time: {
        type: DataTypes.TIME,
        allowNull: true,
      },
      old_total_hours: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      new_total_hours: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      old_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      new_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      old_remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      new_remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      updated_by_user_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      updated_by_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "attendance_edit_logs",
      timestamps: true,
      underscored: true,
      updatedAt: false,
    }
  );

  return AttendanceEditLog;
};

export default defineAttendanceEditLog;
