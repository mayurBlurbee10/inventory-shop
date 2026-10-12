// One-off: register existing users in MStrategy Access Control as shop owners.
// Users the PAP already knows are skipped, so roles assigned in the PAP are never overwritten.
// Run: pnpm rbac:sync-users
import "dotenv/config";
import prisma from "../src/lib/db.js";
import { registerUserInRbac, resolveRolesByEmail } from "../src/lib/accesscontrol.js";
import { DEFAULT_SIGNUP_ROLE } from "../src/constants/access.js";

const users = await prisma.user.findMany({ select: { id: true, name: true, email: true } });
let registered = 0;
for (const user of users) {
    const roles = await resolveRolesByEmail(user.email);
    if (roles.length) {
        console.log(`skip     ${user.email} (roles: ${roles.join(", ")})`);
        continue;
    }
    const result = await registerUserInRbac({ name: user.name, email: user.email, role: DEFAULT_SIGNUP_ROLE, externalId: user.id });
    console.log(`${result ? "register" : "FAILED  "} ${user.email} -> ${DEFAULT_SIGNUP_ROLE}`);
    if (result) registered++;
}
console.log(`Done: ${registered} registered, ${users.length - registered} skipped or failed`);
await prisma.$disconnect();
