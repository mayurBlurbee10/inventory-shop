export const sanitizeName = (name) => {
  let sanitizeName = name?.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName?.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
};