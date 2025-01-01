import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import BaseTable from "./BaseTable";

@Entity()
export class ApiLogs extends BaseTable{
  @Column({ type: "text" })
  date;

  @Column({ type: "text" })
  userId;

  @Column({ type: "text" })
  name;

  @Column({ type: "text" })
  type;
}
