import { DataTypes } from "sequelize";

const defineAttendance = (sequelize) => {
  const Attendance = sequelize.define(
    "Attendance",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      attendance_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      punch_time: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "present",
      },
      remarks: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "attendances",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["code", "attendance_date"],
        },
        {
          fields: ["attendance_date", "punch_time"],
        },
      ],
    }
  );

  return Attendance;
};

export default defineAttendance;
