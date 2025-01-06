import "reflect-metadata";
import { Column, Entity, OneToMany } from "typeorm";
import BaseTable from "./BaseTable";
import { ContentManagement } from "./ContentManagement";
import { Users } from "./Users";

export @Entity()
 class Portals extends BaseTable {
  @Column({ type: "nvarchar", length: 255, unique: true })
  legalName;

  @Column({ type: "nvarchar", length: 255 })
  tradingName;

  @Column({ type: "nvarchar", length: 255 })
  domain;

  @Column({ type: "nvarchar", length: 255 })
  status;

  @Column({ type: "int", default: 0 })
  userCount;

  @Column({ type: "nvarchar", length: 255, default: "0 GB" })
  storageUsed;

  @Column({ type: "nvarchar", length: 255 })
  theme;

  @Column({ type: "nvarchar", length: 255 })
  primaryColor;

  @Column({ type: "nvarchar", length: 255 })
  secondaryColor;

  @Column({ type: "simple-json", nullable: true })
  security;

  @Column({ type: "simple-json", nullable: true })
  permissions;

  @Column({ type: "int" })
  retentionAudit;

  @Column({ type: "nvarchar", length: 255 })
  retentionBackup;

  @Column({ type: "int" })
  storageLimit;

  @Column({ type: "int" })
  userLimit;

  @Column({ type: "nvarchar", length: 255 })
  logo;

  // @OneToMany(() => ContentManagement, (content) => content.portal, {
  //   cascade: true,
  // })
  // content;

  // @OneToMany(() => Users, (user) => user.portal, { cascade: true })
  // users;
}
