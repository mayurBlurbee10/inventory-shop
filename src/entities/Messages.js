import "reflect-metadata";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import BaseTable from "./BaseTable";
import { Users } from "./Users";

export
@Entity("messages")
class Messages extends BaseTable {
  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  text;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "sender" })
  sender;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "receiver" })
  receiver;

  @Column({ type: "bit", nullable: false, default: 0 })
  seen;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId;

  @Column({ type: "nvarchar", length: "MAX", nullable: true })
  subject;
}
