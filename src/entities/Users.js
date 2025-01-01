import "reflect-metadata";
import { Column, Entity, ManyToOne, OneToOne } from "typeorm";
import BaseTable from "./BaseTable";
import { Portals } from "./Portals";

@Entity()
export class Users extends BaseTable {
  @Column({ type: "text", unique: true })
  email;

  @Column({ type: "text" })
  name;

  @ManyToOne(() => Portals, { nullable: true })
  @Column({ type: "text" })
  portalId;

  @Column({ type: "simple-json", nullable: true })
  company;

  @Column({ type: "text" })
  title;

  @Column({
    type: "text",
    enum: ["user", "admin", "super_admin"],
    default: "user",
  })
  role;

  @Column({ type: "text" })
  boxUserId;

  //   @OneToOne(() => Folders, (folder) => folder.user)  1-1
  @Column({ type: "text" })
  folderId;

  @Column({ type: "text", default: null })
  password;

  @Column({ type: "text", default: null })
  extra;

  @Column({ type: "text", nullable: true, default: null })
  accessToken;

  @Column({ type: "uuid", nullable: true, default: null })
  resetPasswordToken;

  @Column({
    type: "text",
    enum: ["google", "microsoft", "okta", "oauth", "email"],
    default: "email",
  })
  authStrategy;
}
