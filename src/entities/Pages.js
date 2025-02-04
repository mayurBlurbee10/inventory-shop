import "reflect-metadata";
import { Column, Entity, ManyToOne } from "typeorm";
import BaseTable from "./BaseTable";
import { Plugins } from "./Plugins";

export
@Entity()
class Pages extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  title;

  // text type is nvarchar(MAX)
  @Column({ type: "text" })
  description;

  @ManyToOne(() => Plugins, (plugin) => plugin.pages)
  plugin;
}