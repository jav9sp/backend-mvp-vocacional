export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("student_profiles", {
    userId: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      references: { model: "users", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    educationType: {
      type: Sequelize.ENUM("ch", "ch_adultos", "tp"),
      allowNull: false,
    },
    nemAvg: { type: Sequelize.DECIMAL(3, 2), allowNull: false },
    nemYear: { type: Sequelize.INTEGER, allowNull: false },
    nemScore: { type: Sequelize.INTEGER, allowNull: false },
    rankingScore: { type: Sequelize.INTEGER, allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex("student_profiles", ["educationType"], {
    name: "idx_student_profiles_education_type",
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable("student_profiles");
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_student_profiles_educationType";',
  );
}
