import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  ForeignKey,
  AllowNull,
  Index,
  BelongsTo,
} from "sequelize-typescript";
import User from "./User.model.js";

@Table({ tableName: "paes_score_records", timestamps: true })
export default class PaesScoreRecord extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Index("idx_paes_score_records_student")
  @Column(DataType.INTEGER)
  declare studentUserId: number;

  @AllowNull(false)
  @Column(DataType.STRING(120))
  declare name: string;

  @AllowNull(true)
  @Column(DataType.STRING(500))
  declare notes: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare takenAt: Date | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare cl: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare m1: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare m2: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare ciencias: number | null;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  declare historia: number | null;

  @BelongsTo(() => User, { foreignKey: "studentUserId", as: "studentUser" })
  declare studentUser?: any;
}
