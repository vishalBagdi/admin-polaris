import { DataTypes } from "sequelize";

const defineEmployeeProfile = (sequelize) => {
  const EmployeeProfile = sequelize.define(
    "EmployeeProfile",
    {
      id: {
        type: DataTypes.BIGINT,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      spouse_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      mobile_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      alternative_mobile_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emergency_contact_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      department: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      designation: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      date_of_joining: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      date_of_birth: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      date_of_exit: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      date_of_releasing: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      photo: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      employment_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "full_time",
      },
      gender: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      marital_status: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      blood_group: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      qualification: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nationality: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      personal_email: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      current_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      permanent_address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      manager_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      probation_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      bank_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bank_account_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      ifsc_code: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pan_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      aadhaar_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      passport_no: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      emergency_contact_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      emergency_contact_phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "employee_profiles",
      timestamps: true,
      underscored: true,
    }
  );

  return EmployeeProfile;
};

export default defineEmployeeProfile;
