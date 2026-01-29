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
} from "sequelize-typescript";
import Attempt from "./Attempt.model.js";
import InapQuestion from "./InapQuestion.model.js";

@Table({
  tableName: "inap_answers",
  timestamps: true,
  indexes: [
    {
      name: "uniq_inap_answers_attempt_question",
      unique: true,
      fields: ["attemptId", "questionId"],
    },
    {
      name: "idx_inap_answers_attempt",
      fields: ["attemptId"],
    },
  ],
})
class InapAnswer extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Attempt)
  @AllowNull(false)
  @Index("idx_inap_answers_attempt")
  @Column(DataType.INTEGER)
  declare attemptId: number;

  @BelongsTo(() => Attempt, { foreignKey: "attemptId", as: "attempt" })
  declare attempt?: any;

  @ForeignKey(() => InapQuestion)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare questionId: number;

  @BelongsTo(() => InapQuestion, { foreignKey: "questionId", as: "question" })
  declare question?: any;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare value: boolean;
}

export default InapAnswer;
