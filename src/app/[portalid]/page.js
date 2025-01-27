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
  const { portalid } = await params;

    const reversedPortalName = reverseSanitizeName(portalid);

    // Check if portal exists
    const portalExists = await portalService.getPortalByLegalName(
      reversedPortalName
    );

    if (!portalExists) {
      // return notFound(); // Triggers the 404 page
      redirect(`/${portalid}/not-found`)
    }

    // Redirect to login page
    redirect(`/${portalid}/login`);
}
