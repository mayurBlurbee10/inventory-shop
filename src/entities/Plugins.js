import "reflect-metadata";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import BaseTable from "./BaseTable";
import { Users } from "./Users";
import { Pages } from "./Pages";

export
@Entity()
class Plugins extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  type;

  // @OneToMany(() => Pages, { cascade: true })
  // // @Column({ type: "simple-json", nullable: true, default: "[]" })
  // @JoinColumn({ name: "pageId" })
  // pageId;
  @OneToMany(() => Pages, (page) => page.plugin, { cascade: true })
  pages;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "createdBy" })
  createdBy;

  @ManyToOne(() => Users, { nullable: true })
  @JoinColumn({ name: "updatedBy" })
  updatedBy;
}
