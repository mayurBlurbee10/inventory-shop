import "reflect-metadata";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import BaseTable from "./BaseTable";
import { Users } from "./Users";
import { TaskStatus, TaskType } from "@/config/constants";
import { Tasks } from "./Tasks";

export
@Entity("check_lists")
class CheckLists extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  name;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  description;

  @Column({ type: "datetime", nullable: true })
  dueDate;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "createdBy" })
  createdBy;

  @Column({ type:"bit", nullable: false, default: 0})
  isActive;

  @OneToMany(() => Tasks, (task) => task.checklist, { cascade: true })
  tasks;
}
