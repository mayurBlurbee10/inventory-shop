import "reflect-metadata";
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import BaseTable from "./BaseTable";

export @Entity()
  class ApiLogs extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  date;

  @Column({ type: "nvarchar", length: 255 })
  userId;

  @Column({ type: "nvarchar", length: 255 })
  name;

  @Column({ type: "nvarchar", length: 255 })
  type;
}
