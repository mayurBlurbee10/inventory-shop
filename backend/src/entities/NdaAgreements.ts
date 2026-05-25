import "reflect-metadata";
import { Column, Entity } from "typeorm";
import BaseTable from "./BaseTable.ts";

export
@Entity("nda_agreements")
 class NdaAgreements extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  portalId!: any;

  @Column({ type: "nvarchar", length: 255 })
  title!: any;

  @Column({ type: "nvarchar", length: 32 })
  ndaType!: any;

  @Column({ type: "text", nullable: true })
  description!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  fileId!: any;

  @Column({ type: "nvarchar", length: 512, nullable: true })
  originalFileName!: any;

  @Column({ type: "bit", nullable: false, default: 0 })
  isDefault!: any;
}