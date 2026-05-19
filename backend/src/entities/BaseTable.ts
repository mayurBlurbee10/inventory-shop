import {
  BaseEntity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

class BaseTable extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: any;

  @CreateDateColumn({ type: "datetime" })
  createdAt!: any;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt!: any;
}
export default BaseTable;
