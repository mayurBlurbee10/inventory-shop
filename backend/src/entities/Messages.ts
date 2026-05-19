import "reflect-metadata";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import BaseTable from "./BaseTable.ts";
import { Users } from "./Users.ts";

export
@Entity("messages")
class Messages extends BaseTable {
  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  text!: any;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "sender" })
  sender!: any;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "receiver" })
  receiver!: any;

  @Column({ type: "bit", nullable: false, default: 0 })
  seen!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId!: any;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  subject!: any;

  @ManyToOne(() => Messages, (message) => message.replies, { nullable: true })
  @JoinColumn({ name: "parentMessage" })
  parentMessage!: any;

  @OneToMany(() => Messages, (message) => message.parentMessage)
  replies!: any;
}
