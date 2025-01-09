// import { ContentManagement } from "@/entities/ContentManagement";
"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import ContentManagementContent from "@/components/Settings/ContentManagementContent";
import UsersContent from "@/components/Settings/UsersContent";
import { ChevronRight, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const WizardStep = ({ step, currentStep }) => {
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;

  return (
    <div className="flex items-center">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center border
          ${
            isCompleted
              ? "bg-gray-900 border-gray-900"
              : isActive
              ? "bg-white border-gray-900"
              : "bg-white border-gray-300"
          }
          ${isCompleted || isActive ? "text-white" : "text-gray-500"}
        `}
      >
        {isCompleted ? (
          <Check size={16} className="text-white" />
        ) : (
          <span className={isActive ? "text-gray-900" : "text-gray-500"}>
            {step + 1}
          </span>
        )}
      </div>
      <div className={`ml-3 ${isActive ? "text-gray-900" : "text-gray-500"}`}>
        {["Content Management", "Create User"][step]}
      </div>
    </div>
  );
};

export default function OnBoardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [errors, setErrors] = useState({});

  const steps = [{ component: ContentManagementContent }, { component: UsersContent }];
  const CurrentStepComponent = steps[currentStep].component;

  useEffect(() => {
    const userData = getUserData();
    if(!userData?.isOnboardingRequired) {
      router.push("login");
    }
  }, [router]);

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleNext = async () => {
    if(validateStep()){
      if (currentStep === 1) {
        setIsSubmitting(true);
        const userData = getUserData();
        completeOnboarding(userData.id)
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
    setTimeout(()=>{
      setErrors({});
    },3000)
  };

  const completeOnboarding = async(id) => {
    const requestOptions = {
      method:  "PUT",
      body: JSON.stringify({id}),
    };
    const response = await fetchWrapper(
        `/api/users`,
        requestOptions,
        'changeOnboarding'
    );

    if (!response.ok) throw new Error(response.error);
    router.push(`home`);
  }

  const handleContentLengthChange = (event) =>{
    setContentLength(event);
  };

  const validateStep = () => {
    const errors = {};

    switch (currentStep) {
      case 0:
        if (contentLength<11) errors.contentLength = 'Please add all content items.';
        break;
      case 2:
        break;
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  return (
    <div className="fixed inset-0 min-h-screen bg-gray-50 bg-opacity-80 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-3xl h-[calc(100vh-120px)] flex flex-col relative">
        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center space-y-3">
              <div className="mx-auto h-8 w-8 animate-spin">
                <div className="h-full w-full rounded-full border-4 border-gray-200 border-t-gray-800"></div>
              </div>
              <p className="text-sm text-gray-500"> Onboarding completed successfully...</p>
            </div>
          </div>
        )}
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-8">
            {[0, 1].map((step) => (
              <div key={step} className="flex items-center">
                <WizardStep step={step} currentStep={currentStep} />
                {step < 1 && (
                  <ChevronRight size={16} className="mx-2 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <CurrentStepComponent  isAddRequired='true' onContentLengthChange={handleContentLengthChange}  />
        </div>
        {errors.contentLength && (
          <div className="flex items-center p-4 m-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50" role="alert">
            <div>
              {errors.contentLength}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex justify-between">
          {currentStep === 0 ? (
            <div></div>
          ) : (
            <button
              onClick={currentStep === 0 ? onClose : handleBack}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
              disabled={isSubmitting}
            >
              {currentStep === 0 ? "Cancel" : "Back"}
            </button>
          )}

          <button
            onClick={handleNext}
            disabled={isSubmitting}
            className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-900 hover:bg-gray-800"
            }`}
          >
            {currentStep === steps.length - 1
              ? "Complete Onboarding"
              : "Continue"}
          </button>
        </div>
      </div>
    </div>
  );
}
