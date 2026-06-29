import "reflect-metadata";
import { Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import { Users } from "./Users.ts";
import { Portals } from "./Portals.ts";
import { NotificationStatus, NotificationType } from "../config/constants.ts";
import BaseTable from "./BaseTable.ts";

@Entity("in_app_notifications")
export class InAppNotifications extends BaseTable {
  @ManyToOne(() => Users, { nullable: false, onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: Users;

  @ManyToOne(() => Portals, { nullable: true })
  @JoinColumn({ name: "portal" })
  portal!: Portals;

  @Column({ type: "nvarchar", length: 255, nullable: false })
  title!: string;

  @Column({ type: "nvarchar", length: 500, nullable: false })
  body!: string;

  @Column({ type: "nvarchar", length: 500, nullable: true })
  url?: string;

  @Column({
    type: "simple-enum",
    enum: NotificationStatus,
    nullable: false,
    default: NotificationStatus.UNREAD
  })
  status!: NotificationStatus;

  @Column({
    type: "simple-enum",
    enum: NotificationType,
    nullable: true,
    default: NotificationType.SYSTEM
  })
  type?: NotificationType;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  referenceId?: string; // ID of the related entity (message, comment, etc.)

  @Column({ type: "datetime", nullable: true })
  readAt?: Date;
}