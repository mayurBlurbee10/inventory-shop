import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import BaseTable from "./BaseTable";

@Entity()
export class TestDb{
  @Column({ type: "simple-json", nullable: true })
  company;

  @Column({ type: "simple-json", nullable: true })
  boxUsersFiles;
}
