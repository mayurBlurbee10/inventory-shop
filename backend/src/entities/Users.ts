import "reflect-metadata";
import {
  BeforeInsert,
  BeforeUpdate,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import BaseTable from "./BaseTable.ts";
import { Portals } from "./Portals.ts";
import * as bcrypt from "bcrypt";
import { IsNotEmpty, ValidateIf } from "class-validator";
import { UserRole } from "../config/constants.ts";

export
@Entity("users")
class Users extends BaseTable {
  @Column({ type: "nvarchar", length: 255, unique: true })
  email!: any;

  @Column({ type: "nvarchar", length: 255 })
  firstName!: any;

  @Column({ type: "nvarchar", length: 255 })
  lastName!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  ndaPages!: any;

  @Column({ type: "simple-json", nullable: true, default: "{}" })
  company!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  title!: any;

  @Column({
    type: "simple-enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  boxUserId!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  folderId!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  password!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  extra!: any;

  @Column({ type: "nvarchar", length: "MAX", nullable: true, default: null })
  accessToken!: any;

  @Column({ type: "nvarchar", length: "MAX", nullable: true, default: null })
  refreshToken!: any;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  resetPasswordToken!: any;

  @Column({
    type: "simple-enum",
    enum: ["google", "microsoft", "okta", "oauth", "email"],
    default: "email",
  })
  authStrategy!: any;

  @Column({ type: "simple-json", nullable: true, default: "[]" })
  collaborationIds!: any;

  @Column({ type: "bit", nullable: false, default: 0 })
  isOnboardingRequired!: any;

  @Column({ type: "bit", nullable: false, default: 0 })
  isTNCAccepted!: any;

  @Column({ type: "simple-json", nullable: true, default: "[]" })
  groupMembersIds!: any;

  @Column({ type: "simple-json", nullable: true, default: "[]" })
  permissions!: any;

  @Column({ type: "simple-json", nullable: true, default: "[]" })
  signRequestsId!: any;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  phoneNo!: any;
}
