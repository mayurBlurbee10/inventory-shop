import { redirect } from "next/navigation";
// ✅ Use `async function` for Server Component
export default async function PortalPage({ params }) {
  redirect(`/login`);
}
