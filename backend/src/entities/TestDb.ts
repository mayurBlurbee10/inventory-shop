import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import BaseTable from "./BaseTable.ts";

export @Entity("test_db")
  class TestDb extends BaseTable {
  @Column({ type: "simple-json", nullable: true })
  company!: any;

  @Column({ type: "simple-json", nullable: true })
  boxUsersFiles!: any;
}
