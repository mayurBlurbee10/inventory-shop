import "reflect-metadata";
import { Column, Entity, ManyToOne } from "typeorm";
import BaseTable from "./BaseTable";
import { Portals } from "./Portals";

@Entity()
export class ContentManagement extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  title;

  @Column({ type: "nvarchar", length: 255 })
  type;

  @Column({ type: "nvarchar", length: 500, nullable: true, default: null })
  value;

  @ManyToOne(() => Portals, (portal) => portal.content, { nullable: true })
  portal;
}
