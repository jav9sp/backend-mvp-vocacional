"use strict";

/** @type {import("sequelize").Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("paes_score_records", {
      id: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },

      studentUserId: {
        type: Sequelize.DataTypes.INTEGER,
        allowNull: false,
        references: { model: "users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },

      name: {
        type: Sequelize.DataTypes.STRING(120),
        allowNull: false,
      },

      notes: {
        type: Sequelize.DataTypes.STRING(500),
        allowNull: true,
      },

      takenAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: true,
      },

      cl: { type: Sequelize.DataTypes.INTEGER, allowNull: true },
      m1: { type: Sequelize.DataTypes.INTEGER, allowNull: true },
      m2: { type: Sequelize.DataTypes.INTEGER, allowNull: true },
      ciencias: { type: Sequelize.DataTypes.INTEGER, allowNull: true },
      historia: { type: Sequelize.DataTypes.INTEGER, allowNull: true },

      createdAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        type: Sequelize.DataTypes.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    // Índice por estudiante
    await queryInterface.addIndex("paes_score_records", ["studentUserId"], {
      name: "idx_paes_score_records_student",
    });

    // Índice útil para listar “más recientes”
    await queryInterface.addIndex(
      "paes_score_records",
      ["studentUserId", "takenAt", "createdAt"],
      { name: "idx_paes_score_records_student_recent" },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("paes_score_records");
  },
};
