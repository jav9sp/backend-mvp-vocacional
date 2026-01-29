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
  BelongsTo,
} from "sequelize-typescript";
import Attempt from "./Attempt.model.js";

@Table({
  tableName: "inap_results",
  timestamps: true,
  indexes: [
    { name: "uniq_inap_results_attempt", unique: true, fields: ["attemptId"] },
    { name: "idx_inap_results_attempt", fields: ["attemptId"] },
  ],
})
class InapResult extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Attempt)
  @Unique
  @AllowNull(false)
  @Index("idx_inap_results_attempt")
  @Column(DataType.INTEGER)
  declare attemptId: number;

  @BelongsTo(() => Attempt, { foreignKey: "attemptId", as: "attempt" })
  declare attempt?: any;

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare scoresByAreaDim: Record<
    string,
    { interes: number; aptitud: number; total: number }
  >;

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare maxByAreaDim: Record<
    string,
    { interes: number; aptitud: number; total: number }
  >;

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare percentByAreaDim: Record<
    string,
    { interes: number; aptitud: number; total: number }
  >;

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare topAreas: string[];
}

export default InapResult;
