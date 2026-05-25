import "reflect-metadata";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import BaseTable from "./BaseTable.ts";
import { Users } from "./Users.ts";
import { Tasks } from "./Tasks.ts";

export
@Entity("check_lists")
class CheckLists extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  name!: any;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  description!: any;

  @Column({ type: "datetime", nullable: true })
  dueDate!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId!: any;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "createdBy" })
  createdBy!: any;

  @Column({ type:"bit", nullable: false, default: 0})
  isActive!: any;

  @OneToMany(() => Tasks, (task) => task.checklist, { cascade: true, onDelete: "CASCADE" })
  tasks!: any;
}
