import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AllowNull,
  AutoIncrement,
  Unique,
  HasMany,
} from "sequelize-typescript";
import ProgramOffer from "./ProgramOffer.model.js";

@Table({ tableName: "admission_process", timestamps: false })
export default class AdmissionProcess extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare admissionProcessId: number;

  @Unique
  @AllowNull(false)
  @Column(DataType.SMALLINT)
  declare year: number;

  @HasMany(() => ProgramOffer, {
    foreignKey: "admissionProcessId",
    as: "offers",
  })
  declare offers?: any[];
}
