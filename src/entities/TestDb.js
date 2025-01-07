import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import BaseTable from "./BaseTable";

export @Entity("test_db")
  class TestDb{
  @Column({ type: "simple-json", nullable: true })
  company;

  @Column({ type: "simple-json", nullable: true })
  boxUsersFiles;
}
