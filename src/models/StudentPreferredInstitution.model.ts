import {
  Table,
  Model,
  Column,
  DataType,
  ForeignKey,
  PrimaryKey,
  AllowNull,
  CreatedAt,
} from "sequelize-typescript";
import User from "./User.model.js";

@Table({ tableName: "student_preferred_institution", timestamps: false })
export default class StudentPreferredInstitution extends Model {
  @PrimaryKey
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "user_id" })
  declare userId: number;

  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "institution_id" })
  declare institutionId: number;

  @CreatedAt
  @Column({ type: DataType.DATE, field: "created_at" })
  declare createdAt: Date;
}
