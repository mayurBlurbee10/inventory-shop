export const sanitizeName = (name: string): string => {
  let sanitizeName = name?.trim().toLowerCase().replace(/\s+/g, "-");
  return sanitizeName?.endsWith(".") ? sanitizeName.slice(0, -1) : sanitizeName;
};

export const reverseSanitizeName = (sanitizedName: string): string => {
  let reversedName = sanitizedName?.endsWith("-")
    ? sanitizedName.slice(0, -1)
    : sanitizedName;

  reversedName = reversedName?.replace(/-/g, " ");
  reversedName = reversedName
    ?.split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return reversedName;
};

