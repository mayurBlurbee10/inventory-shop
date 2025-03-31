"use client";
import React, { useMemo, useState } from "react";
import MyPageContent from "./MyPageContent";
import ContentManagementContent from "./ContentManagementContent";
import ProductsContent from "./ProductsContent";
import { useSelector } from "react-redux";
import CheckListContent from "./CheckListContent";

const CustomizationContent = () => {
  const { data: user } = useSelector((state) => state.user);
  const { data: config } = useSelector((state) => state.portal);
  const [isQueryFetched, setIsQueryFetched] = useState(false);

  const [colors, setColors] = useState({
    primaryColor: config.primaryColor,
    secondaryColor: config.secondaryColor,
  });

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
    </div>
  );
};

export default CustomizationContent;
