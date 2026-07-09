import { redirect } from "next/navigation";

export default async function PortalPage({ params }) {
  const portalId = params?.portalid;
  redirect(portalId ? `/${portalId}/login` : "/login");
}
