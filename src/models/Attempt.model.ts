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
import Period from "./Period.model.js";
import InapResult from "./InapResult.model.js";

export type AttemptStatus = "in_progress" | "finished";

@Table({
  tableName: "attempts",
  timestamps: true,
  // OJO: con @Index en columnas, no necesitas duplicar acá,
  // pero lo dejo consistente con tu SQL.
  indexes: [
    { name: "idx_attempts_user", fields: ["userId"] },
    { name: "idx_attempts_period", fields: ["periodId"] },
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

  @ForeignKey(() => Period)
  @AllowNull(false)
  @Index("idx_attempts_period")
  @Column(DataType.INTEGER)
  declare periodId: number;

  @BelongsTo(() => Period, { foreignKey: "periodId", as: "period" })
  declare period?: Period;

  @Default("in_progress")
  @AllowNull(false)
  @Column(DataType.STRING)
  declare status: AttemptStatus;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare answeredCount: number;

  // En DB es timestamptz; Sequelize lo maneja como DATE.
  @AllowNull(true)
  @Column(DataType.DATE)
  declare finishedAt: Date | null;

  @HasOne(() => InapResult, { foreignKey: "attemptId", as: "result" })
  declare result?: any;
}

export default Attempt;
