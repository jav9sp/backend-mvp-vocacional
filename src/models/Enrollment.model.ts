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
  BelongsTo,
} from "sequelize-typescript";
import Period from "./Period.model.js";
import User from "./User.model.js";

export type EnrollmentStatus = "invited" | "active" | "completed" | "removed";

@Table({
  tableName: "enrollments",
  timestamps: true,
  indexes: [
    { name: "idx_enrollments_period", fields: ["period_id"] },
    { name: "idx_enrollments_student", fields: ["student_user_id"] },
    {
      name: "uniq_period_student",
      unique: true,
      fields: ["period_id", "student_user_id"],
    },
  ],
})
class Enrollment extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Period)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare periodId: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare studentUserId: number;

  @Default("active")
  @AllowNull(false)
  @Column(DataType.ENUM("invited", "active", "completed", "removed"))
  declare status: EnrollmentStatus;

  @Column(DataType.JSONB)
  declare meta: Record<string, any> | null;

  @BelongsTo(() => Period, { foreignKey: "periodId", as: "period" })
  declare period?: any;

  @BelongsTo(() => User, { foreignKey: "studentUserId", as: "student" })
  declare student?: any;
}

export default Enrollment;
