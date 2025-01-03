import "reflect-metadata";
import { BeforeInsert, BeforeUpdate, Column, Entity, ManyToOne } from "typeorm";
import BaseTable from "./BaseTable";
import { Portals } from "./Portals";
import * as bcrypt from "bcrypt";

@Entity()
export class Users extends BaseTable {
  @Column({ type: "nvarchar", length: 255, unique: true })
  email;

  @Column({ type: "nvarchar", length: 255 })
  name;

  @ManyToOne(() => Portals, (portal) => portal.users, { nullable: true })
  portal;

  @Column({ type: "simple-json", nullable: true })
  company;

  @Column({ type: "nvarchar", length: 255 })
  title;

  @Column({
    type: "simple-enum",
    enum: ["user", "admin", "super_admin"],
    default: "user",
  })
  role;

  @Column({ type: "nvarchar", length: 255 })
  boxUserId;

  @Column({ type: "nvarchar", length: 255 })
  folderId;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  password;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  extra;

  @Column({ type: "nvarchar", length: "MAX", nullable: true, default: null })
  accessToken;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  resetPasswordToken;

  @Column({
    type: "simple-enum",
    enum: ["google", "microsoft", "okta", "oauth", "email"],
    default: "email",
  })
  authStrategy;

  @Column({ type: "simple-json", nullable: true, default: "[]" })
  collaborationIds;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
