"use client";
 import Button from "@/components/Common/Elements/Button";
 import { LockKeyhole } from "lucide-react";
 import { useRouter } from "next/navigation";
 import React from "react";
 
 const AccessdeniedPage = () => {
   const router = useRouter();
 
   const handleGoBackTwoSteps = () => {
     window.history.go(-2);
   };
 
   return (
     <div className="max-w-[1140px] mx-auto w-full font-lato min-h-[80vh] flex items-center justify-center text-black">
       <div className="flex items-center justify-center w-full h-full">
         <div>
           <LockKeyhole className="size-96 text-[#363636]" />
         </div>
         <div className="w-[40%] space-y-5 pl-5">
           <h1 className="text-4xl font-bold">
             You've stumbled on a restricted space
           </h1>
           <p className="text-[#707070]">
             There is nothing for you to see here, so let's get you back to where
             you came from.
           </p>
           <div>
             <Button
               type={"Primary"}
               label={"Go Back"}
               onClick={handleGoBackTwoSteps}
             />
           </div>
         </div>
       </div>
     </div>
   );
 };
 
 export default AccessdeniedPage;