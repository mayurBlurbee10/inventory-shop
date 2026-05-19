import "reflect-metadata";
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import BaseTable from "./BaseTable.ts";
import { ContentManagement } from "./ContentManagement.ts";
import { Users } from "./Users.ts";

export
@Entity("portals")
class Portals extends BaseTable {
  @Column({ type: "nvarchar", length: 255, unique: true })
  legalName!: any;

  @Column({ type: "nvarchar", length: 255 })
  tradingName!: any;

  @Column({ type: "nvarchar", length: 255 })
  domain!: any;

  @Column({ type: "nvarchar", length: 255 })
  status!: any;

  @Column({ type: "int", default: 0 })
  userCount!: any;

  @Column({ type: "nvarchar", length: 255, default: "0 GB" })
  storageUsed!: any;

  @Column({ type: "nvarchar", length: 255 })
  theme!: any;

  @Column({ type: "nvarchar", length: 255 })
  primaryColor!: any;

  @Column({ type: "nvarchar", length: 255 })
  secondaryColor!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  accentColor!: any;

  @Column({ type: "simple-json", nullable: true })
  security!: any;

  @Column({ type: "simple-json", nullable: true })
  permissions!: any;

  @Column({ type: "int" })
  retentionAudit!: any;

  @Column({ type: "nvarchar", length: 255 })
  retentionBackup!: any;

  @Column({ type: "int" })
  storageLimit!: any;

  @Column({ type: "int" })
  userLimit!: any;

  @Column({ type: "nvarchar", length: 255 })
  logo!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  faviconUrl!: any;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "createdBy" })
  createdBy!: any;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "updatedBy" })
  updatedBy!: any;

  @Column({ type: "nvarchar", length: 255, nullable : true, default : "" })
  portalCreatedAdmin!: any;

  // @OneToMany(() => ContentManagement, (content) => content.portal, {
  //   cascade: true,
  // })
  // content;

  // @OneToMany(() => Users, (user) => user.portal, { cascade: true })
  // users;
}
