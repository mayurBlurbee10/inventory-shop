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
import { Users } from "./Users";
import BaseTable from "./BaseTable";

export
@Entity("api_logs")
class ApiLogs extends BaseTable {
  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "createdBy" })
  createdBy;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId;

  @Column({ type: "nvarchar", length: 255 })
  type;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  source;
}