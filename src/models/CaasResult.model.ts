import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  ForeignKey,
  BelongsTo,
  Unique,
} from "sequelize-typescript";
import Attempt from "./Attempt.model.js";

type ScoresByDimension = {
  preocupacion: { score: number; max: number; percentage: number };
  control: { score: number; max: number; percentage: number };
  curiosidad: { score: number; max: number; percentage: number };
  confianza: { score: number; max: number; percentage: number };
};

@Table({
  tableName: "caas_results",
  timestamps: true,
  indexes: [
    {
      name: "uniq_caas_results_attempt",
      unique: true,
      fields: ["attempt_id"],
    },
    {
      name: "idx_caas_results_attempt",
      fields: ["attempt_id"],
    },
  ],
})
export default class CaasResult extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @ForeignKey(() => Attempt)
  @Unique
  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "attempt_id" })
  declare attemptId: number;

  @BelongsTo(() => Attempt)
  declare attempt?: Attempt;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "total_score" })
  declare totalScore: number;

  @AllowNull(false)
  @Column({ type: DataType.INTEGER, field: "max_score" })
  declare maxScore: number;

  @AllowNull(false)
  @Column(DataType.FLOAT)
  declare percentage: number;

  @AllowNull(false)
  @Column({ type: DataType.JSONB, field: "scores_by_dimension" })
  declare scoresByDimension: ScoresByDimension;

  @AllowNull(true)
  @Column(DataType.STRING(20))
  declare level: "bajo" | "medio" | "alto" | null;

  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}
