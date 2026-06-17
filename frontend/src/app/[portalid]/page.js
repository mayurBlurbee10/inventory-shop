import { notFound, redirect } from "next/navigation";

function reverseSanitizeName(sanitizedName) {
  let reversedName = sanitizedName.endsWith("-")
    ? sanitizedName.slice(0, -1)
    : sanitizedName;

  reversedName = reversedName.replace(/-/g, " ");
  reversedName = reversedName
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return reversedName;
}

// ✅ Use `async function` for Server Component
export default async function PortalPage({ params }) {
  // // 🔹 Ensure `params` is available before accessing `portalid`
 

  // const portalid = params.portalid; // ✅ Access params correctly

  // const excludeRoutes = ["login", "dashboard", "my-docs", "shared-docs"];

  // if (excludeRoutes.includes(portalid)) {
  //   redirect(`/${portalid}`);
  // }

  // const reversedPortalName = reverseSanitizeName(portalid);

  // const portalExists = await portalService.getPortalByLegalName(
  //   reversedPortalName
  // );

  // if (!portalExists) {
  //   redirect(`/${portalid}/not-found`);
  // }

  redirect(`/login`);
}
