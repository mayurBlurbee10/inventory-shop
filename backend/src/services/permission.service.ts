import "reflect-metadata";
import { connectDatabase, getConnection } from "../config/db.ts";
import { Users } from "../entities/Users.ts";
import userService from "./user.service.ts";
import { UserRole } from "../config/constants.ts";

const getRepository = async (entity: any) => {
  await connectDatabase();
  const connection = getConnection();
  return connection.getRepository(entity);
};

const removePermission = async (userId: string, portalId: string) => {
  const userRepository = await getRepository(Users);
  try {
    const userExist = await userRepository.findOneBy({ id: userId });
    if (!userExist) {
      throw new Error("user not exist");
    }
    if (Array.isArray(userExist.permissions)) {
      userExist.permissions = userExist.permissions.filter(
        (item: any) => item.portalId !== portalId
      );
    }
    await userRepository.save(userExist);
    return "User deleted successfully.";
  } catch (error) {
    throw new Error(`Failed to delete user. ${(error as Error).message}`);
  }
};

const updatePermission = async (id: string, updatedData: any) => {
  const userRepository = await getRepository(Users);
  try {
    const mainUser = await userService.getUserById(id);
    if (!mainUser) {
      throw new Error("User not found");
    }

    if (updatedData.permissions) {
      const { permissions, ...rest } = updatedData;

      if (!Array.isArray(mainUser.permissions)) {
        mainUser.permissions = [];
      }

      const existingPermission = mainUser.permissions.find(
        (perm: any) => perm.portalId === permissions.portalId
      );

      if (existingPermission) {
        if (existingPermission.role !== permissions.role) {
          existingPermission.role = permissions.role;
          Object.assign(mainUser, rest);
          await userRepository.save(mainUser);
          console.log("User role updated successfully!");
          return mainUser;
        } else {
          throw new Error(
            permissions.role === UserRole.SUPER_ADMIN
              ? "Super admin already exists"
              : "User already exists in this portal"
          );
        }
      } else {
        mainUser.permissions.push(permissions);
        Object.assign(mainUser, rest);
        await userRepository.save(mainUser);
        console.log("User updated successfully!");
        return mainUser;
      }
    }

    Object.assign(mainUser, updatedData);
    await userRepository.save(mainUser);
    console.log("User updated successfully!");
    return mainUser;
  } catch (error) {
    console.error("Error updating user:", (error as Error).message);
    throw error;
  }
};

export default {
  removePermission,
  updatePermission,
};

