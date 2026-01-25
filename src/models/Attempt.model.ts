import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  ForeignKey,
  Index,
  BelongsTo,
  HasOne,
} from "sequelize-typescript";
import User from "./User.model.js";
import Test from "./Test.model.js";
import Period from "./Period.model.js";
import InapResult from "./InapResult.model.js";

export type AttemptStatus = "in_progress" | "finished";

@Table({
  tableName: "attempts",
  timestamps: true,
  indexes: [
    { name: "idx_attempts_user", fields: ["userId"] },
    { name: "idx_attempts_period", fields: ["periodId"] },
    { name: "idx_attempts_test", fields: ["testId"] },
    {
      name: "uniq_attempts_period_user",
      unique: true,
      fields: ["periodId", "userId"],
    },
  ],
})
class Attempt extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index("idx_attempts_user")
  @Column(DataType.INTEGER)
  declare userId: number;

  @BelongsTo(() => User, { foreignKey: "userId", as: "user" })
  declare user?: User;

  @Index("idx_attempts_period")
  @ForeignKey(() => Period)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare periodId: number;

  @BelongsTo(() => Period, { foreignKey: "periodId", as: "period" })
  declare period?: Period;

  @ForeignKey(() => Test)
  @AllowNull(false)
  @Index("idx_attempts_test")
  @Column(DataType.INTEGER)
  declare testId: number;

  @BelongsTo(() => Test, { foreignKey: "testId", as: "test" })
  declare test?: Test;

  @Default("in_progress")
  @AllowNull(false)
  @Column(DataType.ENUM("in_progress", "finished"))
  declare status: AttemptStatus;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare answeredCount: number;

  @Column(DataType.DATE)
  declare finishedAt: Date | null;

  @HasOne(() => InapResult, { foreignKey: "attemptId", as: "result" })
  declare result?: InapResult;
}

export default Attempt;
