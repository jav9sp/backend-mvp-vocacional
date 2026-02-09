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
import Attempt from "./Attempt.model.js";
import CaasQuestion from "./CaasQuestion.model.js";

@Table({
  tableName: "caas_answers",
  timestamps: true,
  indexes: [
    {
      name: "uniq_caas_answers_attempt_question",
      unique: true,
      fields: ["attempt_id", "question_id"],
    },
    {
      name: "idx_caas_answers_attempt",
      fields: ["attempt_id"],
    },
  ],
})
export default class CaasAnswer extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Attempt)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "attempt_id" })
  declare attemptId: number;

  @BelongsTo(() => Attempt)
  declare attempt?: Attempt;

  @ForeignKey(() => CaasQuestion)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "question_id" })
  declare questionId: number;

  @BelongsTo(() => CaasQuestion)
  declare question?: CaasQuestion;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare value: number; // 1-5

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
