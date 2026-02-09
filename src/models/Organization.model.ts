import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
} from "sequelize-typescript";

@Table({ tableName: "organizations", timestamps: true })
class Organization extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.STRING(180))
  declare name: string;

  @Column(DataType.DATE)
  declare deletedAt?: Date | null;
}

export default Organization;
