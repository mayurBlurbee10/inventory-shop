import "reflect-metadata";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import BaseTable from "./BaseTable.ts";
import { Users } from "./Users.ts";
import { Pages } from "./Pages.ts";

export
@Entity("plugins")
class Plugins extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  type!: any;

  // @OneToMany(() => Pages, { cascade: true })
  // // @Column({ type: "simple-json", nullable: true, default: "[]" })
  // @JoinColumn({ name: "pageId" })
  // pageId;
  @OneToMany(() => Pages, (page) => page.plugin, { cascade: true })
  pages!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId!: any;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "createdBy" })
  createdBy!: any;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "updatedBy" })
  updatedBy!: any;
}
