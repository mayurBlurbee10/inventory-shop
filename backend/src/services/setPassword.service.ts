import userService from "./user.service.ts";

const getUserByToken = async (token: string) => {
  return await userService.getUserByResetPasswordToken(token);
};

const setPasswordByToken = async (token: string, password: string) => {
  return await userService.setPasswordByResetPasswordToken(token, password);
};

export default {
  getUserByToken,
  setPasswordByToken,
};
