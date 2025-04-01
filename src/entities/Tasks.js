import "reflect-metadata";
 import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
 import BaseTable from "./BaseTable";
 import { Users } from "./Users";
 import { TaskStatus, TaskType } from "@/config/constants";
import { CheckLists } from "./CheckLists";
 
 export
 @Entity("tasks")
 class Tasks extends BaseTable {
   @Column({
     type: "simple-enum",
     enum: TaskType,
     default: TaskType.SIGN,
   })
   type;
 
   @Column({ type: "nvarchar", length: 255 })
   title;
 
   // text type is nvarchar(MAX)
   @Column({ type: "text", nullable: true })
   description;
 
   @Column({ type: "simple-json", nullable: true, default: "[]" })
   uploads;

   @Column({ type: "simple-json", nullable: true })
   file;
 
   @Column({ type: "datetime", nullable: true })
   dueDate;
 
   @Column({
     type: "simple-enum",
     enum: TaskStatus,
     default: TaskStatus.PENDING,
   })
   status;
 
   @ManyToOne(() => Users, { nullable: true })
   @JoinColumn({ name: "user" })
   user;
 
   @Column({ type: "nvarchar", length: 255, nullable: true })
   portalId;
 
   @ManyToOne(() => Users, { nullable: true })
   @JoinColumn({ name: "createdBy" })
   createdBy;

   @ManyToOne(() => CheckLists, (checklist) => checklist.tasks, { nullable: true, onDelete: "CASCADE" }) 
   @JoinColumn({ name: "checklist" })
   checklist;
}