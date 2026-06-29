import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Users } from "./Users.ts";
import BaseTable from "./BaseTable.ts";

export
@Entity("api_logs")
class ApiLogs extends BaseTable {
  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "createdBy" })
  createdBy!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId!: any;

  @Column({ type: "nvarchar", length: 255 })
  type!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  source!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  fileSource!: any;
}