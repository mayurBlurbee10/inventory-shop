import {
  BaseEntity,
  CreateDateColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

class BaseTable extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id;

  @CreateDateColumn({ type: "datetime" })
  createdAt;

  @UpdateDateColumn({ type: "datetime" })
  updatedAt;
}
export default BaseTable;
