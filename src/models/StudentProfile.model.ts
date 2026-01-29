import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  ForeignKey,
  AllowNull,
  BelongsTo,
  Index,
} from "sequelize-typescript";
import User from "./User.model.js";
import { EducationType } from "../types/EducationType.js";

@Table({ tableName: "student_profiles", timestamps: true })
export default class StudentProfile extends Model {
  @PrimaryKey
  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  declare userId: number;

  @AllowNull(false)
  @Index("idx_student_profiles_education_type")
  @Column(DataType.ENUM("hc", "hc_adults", "tp"))
  declare educationType: EducationType;

  @AllowNull(false)
  @Column(DataType.DECIMAL(3, 2))
  declare nemAvg: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare nemScore: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare rankingScore: number;

  @BelongsTo(() => User, { foreignKey: "userId", as: "user" })
  declare user?: any;
}
