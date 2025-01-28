import portalService from "@/services/portalService";
import { notFound, redirect } from "next/navigation";

function reverseSanitizeName(sanitizedName) {
  // If the sanitized name ends with a hyphen, remove it
  let reversedName = sanitizedName.endsWith("-")
    ? sanitizedName.slice(0, -1)
    : sanitizedName;

  // Replace hyphens with spaces
  reversedName = reversedName.replace(/-/g, " ");

  // Capitalize the first letter of each word
  reversedName = reversedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  // Return the reconstructed name
  return reversedName;
}

export default async function PortalPage({ params }) {
  const { portalid } = params;

  const excludeRoues = ["login", "dashboard", "my-docs", "shared-docs"];

  if (excludeRoues.includes(portalid)) {
    return redirect(`/${portalid}`); 
  }

  const reversedPortalName = reverseSanitizeName(portalid || "default");

  const portalExists = await portalService.getPortalByLegalName(
    reversedPortalName
  );

  if (!portalExists) {
    return redirect(`/${portalid}/not-found`); 
  }

  return redirect(`/${portalid}/login`);
}
