import { DataTypes } from "sequelize";

const defineLeaveRequest = (sequelize) => {
  const LeaveRequest = sequelize.define(
    "LeaveRequest",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      employee_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      leave_type: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "pending",
      },
      approved_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      approver_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "leave_requests",
      timestamps: true,
      underscored: true,
    }
  );

  return LeaveRequest;
};

export default defineLeaveRequest;
