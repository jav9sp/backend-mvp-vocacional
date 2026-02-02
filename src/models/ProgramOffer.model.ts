import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AllowNull,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import AdmissionProcess from "./AdmissionProcess.model.js";

@Table({ tableName: "program_offer", timestamps: false })
export default class ProgramOffer extends Model {
  // PK compuesta -> en sequelize-typescript se marca con PrimaryKey en ambas
  @PrimaryKey
  @ForeignKey(() => AdmissionProcess)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "admission_process_id" })
  declare admissionProcessId: number;

  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "demre_code" })
  declare demreCode: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "institution_id" })
  declare institutionId: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "location_id" })
  declare locationId: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "career_id" })
  declare careerId: number;

  @Column({ type: DataType.DECIMAL(6, 2), field: "min_pond" })
  declare minPond?: string | null;

  @Column({ type: DataType.DECIMAL(6, 2), field: "min_prom_pond" })
  declare minPromPond?: string | null;

  @Column({ type: DataType.DECIMAL(6, 2), field: "cut_score" })
  declare cutScore?: string | null;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "has_special_test" })
  declare hasSpecialTest: boolean;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "has_special_peda" })
  declare hasSpecialPeda: boolean;

  @Column({ type: DataType.JSONB, field: "raw_row" })
  declare rawRow?: any;

  @BelongsTo(() => AdmissionProcess, {
    foreignKey: "admissionProcessId",
    as: "process",
  })
  declare process?: any;
}
