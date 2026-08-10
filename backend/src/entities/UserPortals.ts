import { Column, Entity, ManyToOne, Unique } from "typeorm";
import BaseTable from "./BaseTable.ts";
import { Users } from "./Users.ts";
import { Portals } from "./Portals.ts";
import { UserRole } from "../config/constants.ts";

const USER_PORTAL_ROLES = Object.values(UserRole);

export
@Unique(["user", "portal"])
@Entity("user_portals")
class UserPortals extends BaseTable {
  @ManyToOne(() => Users, { onDelete: "CASCADE" })
  user!: Users;

  @ManyToOne(() => Portals, { onDelete: "CASCADE", nullable: true })
  portal!: Portals | null;

  @Column({
    type: "simple-enum",
    enum: USER_PORTAL_ROLES,
    default: UserRole.USER,
  })
  role!: string;

  @Column({ type: "datetime", nullable: true, default: null })
  lastLoginAt!: Date | null;
}

export default UserPortals;
