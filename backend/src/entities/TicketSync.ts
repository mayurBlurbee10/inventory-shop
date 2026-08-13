import "reflect-metadata";
import { Column, Entity, Index } from "typeorm";
import BaseTable from "./BaseTable.ts";

export type SyncSource = "zendesk" | "azure" | null;

@Entity("ticket_syncs")
export class TicketSync extends BaseTable {
  @Column({ type: "int", unique: true })
  @Index()
  zendeskTicketId!: number;

  @Column({ type: "int", unique: true })
  @Index()
  azureWorkItemId!: number;

  @Column({ type: "bigint", nullable: true })
  lastZendeskCommentId!: string | null;

  @Column({ type: "bigint", nullable: true })
  lastADOCommentId!: string | null;

  @Column({ type: "nvarchar", length: 10, nullable: true })
  lastSyncSource!: SyncSource;

  @Column({ type: "datetime", nullable: true })
  lastSyncedAt!: Date | null;
}
