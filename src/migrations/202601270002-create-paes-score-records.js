export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("paes_score_records", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    studentUserId: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    name: { type: Sequelize.STRING(120), allowNull: false },
    takenAt: { type: Sequelize.DATE, allowNull: true },
    cl: { type: Sequelize.INTEGER, allowNull: true },
    m1: { type: Sequelize.INTEGER, allowNull: true },
    m2: { type: Sequelize.INTEGER, allowNull: true },
    ciencias: { type: Sequelize.INTEGER, allowNull: true },
    historia: { type: Sequelize.INTEGER, allowNull: true },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex("paes_score_records", ["studentUserId"], {
    name: "idx_paes_score_records_student",
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("paes_score_records");
}
