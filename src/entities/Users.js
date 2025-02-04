import "reflect-metadata";
import { BeforeInsert, BeforeUpdate, Column, Entity, JoinColumn, ManyToOne } from "typeorm";
import BaseTable from "./BaseTable";
import { Portals } from "./Portals";
import * as bcrypt from "bcrypt";
import { IsNotEmpty, ValidateIf } from "class-validator";
import { UserRole } from "@/config/constants";

export @Entity("users")
 class Users extends BaseTable {
  @Column({ type: "nvarchar", length: 255, unique: true })
  email;

  @Column({ type: "nvarchar", length: 255 })
  name;

  @Column({ type: "nvarchar", length: 255, nullable: true })
  portalId;

  @Column({ type: "simple-json", nullable: true, default: "{}" })
  company;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  title;

  @Column({
    type: "simple-enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  boxUserId;

  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
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

  @Column({ type:"bit", nullable: false, default: 0})
  isOnboardingRequired;

  // Make fields optional for super_admin and required for admin/user roles
  @ValidateIf((o) => o.role !== UserRole.SUPER_ADMIN && o.role !== UserRole.MASTER)
  @IsNotEmpty()
  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  title;

  @ValidateIf((o) => o.role !== UserRole.SUPER_ADMIN && o.role !== UserRole.MASTER)
  @IsNotEmpty()
  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  boxUserId;

  @ValidateIf((o) => o.role !== UserRole.SUPER_ADMIN && o.role !== UserRole.MASTER)
  @IsNotEmpty()
  @Column({ type: "nvarchar", length: 255, nullable: true, default: null })
  folderId;

  @Column({ type: "bit", nullable: false, default: 0 })
  isTNCAccepted;

  @Column({ type: "simple-json", nullable: true, default: "[]" })
  groupMembersIds;

  @Column({ type: "simple-json", nullable: true, default: "[]" })
  permissions;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }
}
