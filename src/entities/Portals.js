import "reflect-metadata";
import { Column, Entity, ManyToOne, OneToOne } from "typeorm";
import BaseTable from "./BaseTable";

@Entity()
export class Portals extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  legalName;

  @Column({ type: "nvarchar", length: 255 })
  tradingName;

  @Column({ type: "nvarchar", length: 255 })
  domain;

  @Column({ type: "nvarchar", length: 255 })
  status;

  @Column({ type: "int" })
  userCount;

  @Column({ type: "int" })
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
}
