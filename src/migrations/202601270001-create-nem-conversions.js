export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable("nem_conversions", {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    year: { type: Sequelize.INTEGER, allowNull: false },
    educationType: {
      type: Sequelize.ENUM("ch", "ch_adultos", "tp"),
      allowNull: false,
    },
    nemAvg: { type: Sequelize.DECIMAL(3, 2), allowNull: false },
    nemScore: { type: Sequelize.INTEGER, allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });

  await queryInterface.addIndex(
    "nem_conversions",
    ["year", "educationType", "nemAvg"],
    {
      unique: true,
      name: "ux_nem_conversions_year_type_avg",
    },
  );
}

export async function down(queryInterface) {
  await queryInterface.dropTable("nem_conversions");
  await queryInterface.sequelize.query(
    'DROP TYPE IF EXISTS "enum_nem_conversions_educationType";',
  );
}
