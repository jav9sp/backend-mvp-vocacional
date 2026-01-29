import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  Index,
  BelongsTo,
  Default,
} from "sequelize-typescript";
import Test from "./Test.model.js";

@Table({
  tableName: "inap_questions",
  timestamps: true,
  indexes: [
    {
      name: "uniq_inap_questions_test_external",
      unique: true,
      fields: ["test_id", "external_id"], // ✅ columnas reales
    },
    {
      name: "idx_inap_questions_test",
      fields: ["test_id"], // ✅ columna real
    },
  ],
})
class InapQuestion extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Test)
  @AllowNull(false)
  @Index("idx_inap_questions_test")
  @Column({ type: DataType.INTEGER, field: "test_id" }) // ✅
  declare testId: number;

  @BelongsTo(() => Test, { foreignKey: "testId", as: "test" })
  declare test?: Test;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "external_id" }) // ✅
  declare externalId: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare text: string;

  @AllowNull(false)
  @Column(DataType.STRING(10))
  declare area: string;

  @AllowNull(false)
  @Default([]) // OK: sequelize-typescript lo guarda como array vacío
  @Column(DataType.ARRAY(DataType.TEXT))
  declare dim: string[];

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "order_index" }) // ✅
  declare orderIndex: number;
}

export default InapQuestion;
