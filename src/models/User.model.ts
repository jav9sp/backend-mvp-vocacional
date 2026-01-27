import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  AutoIncrement,
  Unique,
  Default,
  AllowNull,
  Index,
  HasMany,
  BelongsTo,
  HasOne,
} from "sequelize-typescript";
import Enrollment from "./Enrollment.model.js";
import Organization from "./Organization.model.js";
import StudentProfile from "./StudentProfile.model.js";

export type UserRole = "admin" | "student";

@Table({ tableName: "users", timestamps: true })
class User extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare organizationId: number;

  @Unique
  @AllowNull(false)
  @Index("idx_users_rut")
  @Column(DataType.STRING(20))
  declare rut: string;

  @AllowNull(false)
  @Index("idx_users_role")
  @Column(DataType.ENUM("admin", "student"))
  declare role: UserRole;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  declare name: string;

  @Unique
  @AllowNull(false)
  @Column(DataType.STRING(180))
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING(255))
  declare passwordHash: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare mustChangePassword: boolean;

  @BelongsTo(() => Organization, {
    foreignKey: "organizationId",
    as: "organization",
  })
  declare organization?: any;

  @HasMany(() => Enrollment, { foreignKey: "studentUserId", as: "enrollments" })
  declare enrollments?: any[];

  @HasOne(() => StudentProfile, {
    foreignKey: "userId",
    as: "studentProfile",
  })
  declare studentProfile?: any;
}

export default User;
