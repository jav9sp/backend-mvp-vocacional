import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  Unique,
  Index,
} from "sequelize-typescript";
import Attempt from "./Attempt.model.js";

@Table({
  tableName: "results",
  timestamps: true,
  indexes: [
    { name: "uniq_result_attempt", unique: true, fields: ["attemptId"] },
  ],
})
class Result extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Attempt)
  @Unique
  @AllowNull(false)
  @Index("idx_results_attempt")
  @Column(DataType.INTEGER)
  declare attemptId: number;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare scoresByArea: Record<string, number>;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare scoresByAreaDim: Record<
    string,
    { interes: number; aptitud: number; total: number }
  >;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare topAreas: string[];
}

export default Result;
