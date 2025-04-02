"use client";
import React, { useMemo, useState } from "react";
import MyPageContent from "./MyPageContent";
import ContentManagementContent from "./ContentManagementContent";
import ProductsContent from "./ProductsContent";
import { useDispatch, useSelector } from "react-redux";
import CheckListContent from "./CheckListContent";
import Button from "../Common/Elements/Button";
import { TimerReset } from "lucide-react";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { useParams } from "next/navigation";
import { toast } from "react-toastify";
import DeleteConfirmDialog from "../DeleteConfirmDialog";
import { clearUserData } from "@/lib/auth";
import { setFileList } from "@/store/actions/fileAction";
import { setLoans } from "@/store/services/loanService";
import { setPortal } from "@/store/services/portalService";
import { setCurrentUser } from "@/store/services/userService";
import { setPages as setReduxPages } from "@/store/services/pageService";
import { signOut } from "next-auth/react";

const CustomizationContent = () => {
  const params = useParams();
  const { data: user } = useSelector((state) => state.user);
  const { data: config } = useSelector((state) => state.portal);
  const [isQueryFetched, setIsQueryFetched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const { data: loanData } = useSelector((state) => state.loans);
  const dispatch = useDispatch();

  const [colors, setColors] = useState({
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
    accentColor: config.accentColor,
  });

  const clearStoreData = () => {
    dispatch(setFileList(null));
    dispatch(setLoans(loanData?.length === 3 ? loanData.slice(1) : loanData));
    dispatch(setPortal(null));
    dispatch(setCurrentUser(null));
    dispatch(setReduxPages(null));
  };

  const handleLogout = async () => {
    clearUserData();
    clearStoreData();
    await signOut();
    toast.success("User signout successfully");
    document.cookie =
      "authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;";
    window.location.href = params.portalid
      ? `/${params.portalid}/login`
      : "/login";
  };

  const handleReset = async () => {
    try {
      setIsLoading(true);
      const response = await fetchWrapper("/api/reset", {
        method: "POST",
        body: JSON.stringify({
          portalId: params.portalid,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Failed to reset portal.");
      }
      setIsConfirmModalOpen(false);
      toast.success(data?.message);
      await handleLogout();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const MemoizedMyPageContent = useMemo(() => <MyPageContent setIsQueryFetched={setIsQueryFetched}/>, []);

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-white shadow-none md:shadow rounded-lg overflow-y-auto md:p-3 lg:p-5">
        <ContentManagementContent
          isManageRequired={true}
          onboardingStatus={user?.isOnboardingRequired}
          colors={colors}
          setColors={setColors}
        />
      </div>
      <div>{MemoizedMyPageContent}</div>
      <div className="bg-white shadow-none md:shadow rounded-lg overflow-y-auto md:p-3 lg:p-5">
        <ProductsContent isQueryFetched={isQueryFetched} setIsQueryFetched={setIsQueryFetched}/>
      </div>
      <CheckListContent />
      <div className="flex items-center justify-end">
        <Button 
          label={"Reset"}
          icon={TimerReset}
          className="bg-red-600 text-white"
          onClick={() => setIsConfirmModalOpen(true)}
          disabled={isLoading}
        />
      </div>
      <DeleteConfirmDialog 
        title="Reset portal data"
        content="This action will reset portal data. Do you want to continue?"
        handleDelete={handleReset}
        isLoading={isLoading}
        isModalOpen={isConfirmModalOpen}
        setIsModalOpen={setIsConfirmModalOpen}
        buttonText="Reset"
      />
    </div>
  );
};

export default CustomizationContent;
