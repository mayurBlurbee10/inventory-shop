import "reflect-metadata";
import { Column, Entity, ManyToOne } from "typeorm";
import BaseTable from "./BaseTable.ts";
import { Plugins } from "./Plugins.ts";

export
@Entity("pages")
class Pages extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  title!: any;

  // text type is nvarchar(MAX)
  @Column({ type: "text" })
  description!: any;

  @ManyToOne(() => Plugins, (plugin) => plugin.pages, { onDelete: "CASCADE" })
  plugin!: any;

  @Column({ type: "bit", nullable: false, default: 1 })
  isCustomPage!: any;
  
  @Column({ type: "simple-json", nullable: true, default: "[]" })
  visibility!: any;

  @Column({ type: "bit", nullable: false, default: 1 })
  isPageVisible!: any;
}