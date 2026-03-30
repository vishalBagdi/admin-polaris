import { DataTypes } from "sequelize";

const defineSalary = (sequelize) => {
  const Salary = sequelize.define(
    "Salary",
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
      effective_from: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      basic_salary: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      hra: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      ta: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      da: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      special_allowance: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      pf: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      pf_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      esi: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      esi_number: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bonus_once_a_year: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      advance_loan: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      advance_money: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      other_perks: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      paid_leaves: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "USD",
      },
      payment_frequency: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "monthly",
      },
    },
    {
      tableName: "salaries",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["employee_id", "effective_from"],
        },
      ],
    }
  );

  return Salary;
};

export default defineSalary;
