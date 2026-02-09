import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Test from "./Test.model.js";

@Table({
  tableName: "caas_questions",
  timestamps: true,
  indexes: [
    {
      name: "uniq_caas_questions_test_external",
      unique: true,
      fields: ["test_id", "external_id"],
    },
    {
      name: "idx_caas_questions_test",
      fields: ["test_id"],
    },
    {
      name: "idx_caas_questions_dimension",
      fields: ["dimension"],
    },
  ],
})
export default class CaasQuestion extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Test)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "test_id" })
  declare testId: number;

  @BelongsTo(() => Test)
  declare test?: Test;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "external_id" })
  declare externalId: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare text: string;

  @AllowNull(false)
  @Column(DataType.STRING(50))
  declare dimension: "preocupacion" | "control" | "curiosidad" | "confianza";

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "order_index" })
  declare orderIndex: number;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
