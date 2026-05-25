import "reflect-metadata";
 import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
 import BaseTable from "./BaseTable.ts";
 import { Users } from "./Users.ts";
 import { TaskStatus, TaskType } from "../config/constants.ts";
import { CheckLists } from "./CheckLists.ts";
 
 export
 @Entity("tasks")
 class Tasks extends BaseTable {
   @Column({
     type: "simple-enum",
     enum: TaskType,
     default: TaskType.SIGN,
   })
   type!: any;
 
   @Column({ type: "nvarchar", length: 255 })
   title!: any;
 
   // text type is nvarchar(MAX)
   @Column({ type: "text", nullable: true })
   description!: any;
 
   @Column({ type: "simple-json", nullable: true, default: "[]" })
   uploads!: any;

   @Column({ type: "simple-json", nullable: true })
   file!: any;
 
   @Column({ type: "datetime", nullable: true })
   dueDate!: any;
 
   @Column({
     type: "simple-enum",
     enum: TaskStatus,
     default: TaskStatus.PENDING,
   })
   status!: any;
 
   @ManyToOne(() => Users, { nullable: true })
   @JoinColumn({ name: "user" })
   user!: any;
 
   @Column({ type: "nvarchar", length: 255, nullable: true })
   portalId!: any;
 
   @ManyToOne(() => Users, { nullable: true })
   @JoinColumn({ name: "createdBy" })
   createdBy!: any;

   @ManyToOne(() => CheckLists, (checklist) => checklist.tasks, { nullable: true, onDelete: "CASCADE" }) 
   @JoinColumn({ name: "checklist" })
   checklist!: any;
}