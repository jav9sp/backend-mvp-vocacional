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

@Table({ tableName: "student_favorite_offer", timestamps: false })
export default class StudentFavoriteOffer extends Model {
  @PrimaryKey
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "user_id" })
  declare userId: number;

  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "admission_process_id" })
  declare admissionProcessId: number;

  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "demre_code" })
  declare demreCode: number;

  @CreatedAt
  @Column({ type: DataType.DATE, field: "created_at" })
  declare createdAt: Date;
}
