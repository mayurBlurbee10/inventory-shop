import "reflect-metadata";
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  Index,
} from "typeorm";
import { Users } from "./Users.ts";
import BaseTable from "./BaseTable.ts";
import { InbuildPlugins } from "./InbuildPlugins.ts";

@Entity("portal_plugin_configs")
@Index(["portalId", "pluginKey"], { unique: true })
export class PortalPluginConfigs extends BaseTable {
  @Column({ type: "nvarchar", length: 255 })
  portalId!: string;

  @Column({ type: "nvarchar", length: 255 })
  pluginKey!: string;

  @Column({ type: "bit", default: false })
  isEnabled!: boolean; // Portal-specific activation

  @Column({ type: "simple-json", nullable: true })
  configuration?: object; // Portal-specific settings

  @Column({ type: "int", default: 0 })
  usageCount!: number; // Track usage for analytics

  @Column({ type: "int", default: 0 })
  errorCount!: number; // Track errors for monitoring

  @Column({ type: "datetime2", nullable: true })
  lastUsed!: Date;

  @Column({ type: "nvarchar", nullable: true })
  lastError!: string; // Last error message

  @ManyToOne(() => InbuildPlugins, { nullable: false })
  @JoinColumn({ name: "pluginKey", referencedColumnName: "pluginKey" })
  plugin!: InbuildPlugins;
}
