import {
  Table,
  Model,
  Column,
  DataType,
  PrimaryKey,
  AllowNull,
} from "sequelize-typescript";

@Table({
  tableName: "v_offers_flat",
  timestamps: false,
})
class OfferFlat extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column({ type: DataType.STRING(32), field: "offer_key" })
  declare offerKey: string;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "admission_process_id" })
  declare admissionProcessId: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "year" })
  declare year: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "demre_code" })
  declare demreCode: number;

  // En la vista es institution_id (no demre_institution_id)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "institution_id" })
  declare institutionId: number;

  // En la vista es institution (no demre_institution_name)
  @AllowNull(false)
  @Column({ type: DataType.STRING(255), field: "institution_name" })
  declare institutionName: string;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "institution_is_pace" })
  declare institutionIsPace: boolean;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "institution_has_gratuity" })
  declare institutionHasGratuity: boolean;

  @AllowNull(true)
  @Column({ type: DataType.TEXT, field: "institution_url" })
  declare institutionUrl?: string | null;

  // En la vista es career_id y carrera (no career_name)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "career_id" })
  declare careerId: number;

  @AllowNull(false)
  @Column({ type: DataType.STRING(255), field: "career" })
  declare career: string;

  // En la vista es location_id y lugar (no location_name)
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "location_id" })
  declare locationId: number;

  @AllowNull(false)
  @Column({ type: DataType.STRING(255), field: "location_name" })
  declare locationName: string;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "min_pond" })
  declare minPond?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "min_prom_pond" })
  declare minPromPond?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "cut_score" })
  declare cutScore?: number | null;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "has_special_test" })
  declare hasSpecialTest: boolean;

  @AllowNull(false)
  @Column({ type: DataType.BOOLEAN, field: "has_special_peda" })
  declare hasSpecialPeda: boolean;

  // Cupos
  @AllowNull(true)
  @Column({ type: DataType.INTEGER, field: "quota_all" })
  declare quotaAll?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER, field: "quota_s1" })
  declare quotaS1?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER, field: "quota_s2" })
  declare quotaS2?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER, field: "quota_mc" })
  declare quotaMc?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER, field: "quota_bea" })
  declare quotaBea?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.INTEGER, field: "quota_pace" })
  declare quotaPace?: number | null;

  // Ponderaciones (coinciden)
  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "nem" })
  declare nem?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "ranking" })
  declare ranking?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "cl" })
  declare cl?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "m1" })
  declare m1?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "historia" })
  declare historia?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "ciencias" })
  declare ciencias?: number | null;

  @AllowNull(true)
  @Column({ type: DataType.FLOAT, field: "m2" })
  declare m2?: number | null;
}

export default OfferFlat;
