import "reflect-metadata";
import {
  Column,
  Entity,
} from "typeorm";
import BaseTable from "./BaseTable.ts";

@Entity("inbuild_plugins")
export class InbuildPlugins extends BaseTable {
  @Column({ type: "nvarchar", length: 255, unique: true })
  pluginKey!: string; // e.g., "e_sign", "analytics", "notifications", "box_ai"

  @Column({ type: "nvarchar", length: 255 })
  pluginName!: string; // e.g., "E-Signature", "Analytics Dashboard", "Box AI"

  @Column({ type: "nvarchar", nullable: true })
  description?: string;

  @Column({ type: "bit", default: true })
  isSystemPlugin!: boolean; // Built-in vs custom plugins

  @Column({ type: "nvarchar", nullable: true })
  version?: string;

  @Column({ type: "simple-json", nullable: true })
  defaultConfiguration?: object; // Default settings for the plugin

  @Column({ type: "nvarchar", nullable: true })
  icon?: string; // Icon path or class

  @Column({ type: "bit", default: false })
  isActive!: boolean; // Global activation status

  @Column({ type: "nvarchar", nullable: true })
  apiEndpoints!: string; // JSON string of API endpoints

  @Column({ type: "nvarchar", nullable: true })
  permissions!: string; // JSON string of required permissions
}
