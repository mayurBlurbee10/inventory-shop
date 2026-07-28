"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { UserRole } from "@/config/constants";
import { getUserData } from "@/app/lib/auth";
import ReportsPageContent from "@/components/Reports/ReportsPageContent";

export default function ReportsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: pages } = useSelector((state) => state.pages);

  useEffect(() => {
    const user = getUserData();
    const isAdmin =
      user?.role !== UserRole.USER && user?.role !== UserRole.MODERATOR;

    if (!isAdmin) {
      router.replace(`/${params.portalid}/access-denied`);
      return;
    }

    const page = pages?.find((item) => item.title === "reports");
    if (page && !page.isPageVisible) {
      router.replace(`/${params.portalid}/access-denied`);
    }
  }, [pages, params.portalid, router]);

  return <ReportsPageContent />;
}
