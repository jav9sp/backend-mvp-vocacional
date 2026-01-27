import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Index,
} from "sequelize-typescript";
import type { EducationType } from "../types/EducationType.js";

@Table({ tableName: "nem_conversions", timestamps: true })
export default class NemConversion extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Index("idx_nem_conversions_lookup")
  @Column(DataType.INTEGER)
  declare year: number;

  @AllowNull(false)
  @Index("idx_nem_conversions_lookup")
  @Column(DataType.ENUM("hc", "hc_adults", "tp"))
  declare educationType: EducationType;

  @AllowNull(false)
  @Index("idx_nem_conversions_lookup")
  @Column(DataType.DECIMAL(3, 2))
  declare nemAvg: string;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare nemScore: number;
}
