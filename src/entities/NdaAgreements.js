import "reflect-metadata";
import { Column, Entity } from "typeorm";
import BaseTable from "./BaseTable";

export
@Entity("nda_agreements")
 class NdaAgreements extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  portalId;

  @Column({ type: "nvarchar", length: 255 })
  title;

  @Column({ type: "nvarchar", length: 32 })
  ndaType;

  @Column({ type: "text", nullable: true })
  description;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  fileId;

  @Column({ type: "nvarchar", length: 512, nullable: true })
  originalFileName;

  @Column({ type: "bit", nullable: false, default: 0 })
  isDefault;
}