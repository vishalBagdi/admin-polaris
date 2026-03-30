import { DataTypes } from "sequelize";

const defineEmployeeDocument = (sequelize) => {
  const EmployeeDocument = sequelize.define(
    "EmployeeDocument",
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
      document_type: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      document_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      document_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nominee_relation: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      nominee_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bank_name: {
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
      passbook_front_page_photo_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      pan_document_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      aadhaar_document_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      esi_photo_url: {
        type: DataTypes.TEXT,
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
      uan_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pf_account_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      issue_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      expiry_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      document_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      tableName: "employee_documents",
      timestamps: true,
      underscored: true,
    }
  );

  return EmployeeDocument;
};

export default defineEmployeeDocument;
