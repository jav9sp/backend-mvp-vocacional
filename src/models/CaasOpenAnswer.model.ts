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

@Table({
  tableName: "caas_open_answers",
  timestamps: true,
  indexes: [
    {
      name: "uniq_caas_open_answers_attempt_key",
      unique: true,
      fields: ["attempt_id", "question_key"],
    },
    {
      name: "idx_caas_open_answers_attempt",
      fields: ["attempt_id"],
    },
  ],
})
export default class CaasOpenAnswer extends Model {
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

  @AllowNull(false)
  @Column({ type: DataType.STRING(50), field: "question_key" })
  declare questionKey: string; // 'future_vision', 'doubts', 'curiosities'

  @AllowNull(true)
  @Column({ type: DataType.TEXT, field: "answer_text" })
  declare answerText: string | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
