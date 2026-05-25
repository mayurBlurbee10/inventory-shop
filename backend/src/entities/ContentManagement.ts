import "reflect-metadata";
import { Column, Entity, ManyToOne } from "typeorm";
import BaseTable from "./BaseTable.ts";

export @Entity("content_management")
 class ContentManagement extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  title!: any;

  @Column({ type: "nvarchar", length: 255 })
  type!: any;

  @Column({ type: "nvarchar", length: 500, nullable: true, default: null })
  value!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  fontSize!: any;

  @Column({ type: "simple-json", nullable: true, default: "{}" })
  theme!: any;
}
