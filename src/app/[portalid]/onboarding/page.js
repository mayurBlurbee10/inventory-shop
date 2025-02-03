// import { ContentManagement } from "@/entities/ContentManagement";
"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Footer from "@/components/Footer";
import ContentManagementContent from "@/components/Settings/ContentManagementContent";
import UsersContent from "@/components/Settings/UsersContent";
import { ChevronRight, Check, IdCard, LockKeyhole } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

const WizardStep = ({ step, currentStep }) => {
  const isCompleted = currentStep > step;
  const isActive = currentStep === step;

  return (
    <div className="flex items-center">
      <div
        className={`
          w-8 h-8 rounded-full flex items-center justify-center border
          ${isCompleted
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
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [errors, setErrors] = useState({});
  const [config, setConfig] = useState([]);
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  const steps = [
    { component: ContentManagementContent },
    { component: UsersContent },
  ];
  const CurrentStepComponent = steps[currentStep].component;

  useEffect(() => {
    const userData = getUserData();
    if (!userData?.isOnboardingRequired) {
      router.push("login");
    }
  }, [router]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetchWrapper(
        `/api/contentManagement?portalId=${params.portalid ?? "default"}`,
        { method: "GET" },
        "fetchContentManagement"
      );
      if (!response.ok) throw new Error("Failed to fetch Content Management");
      const data = await response.json();
      setContent(data.portalContent);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await fetchWrapper(
          `/api/portal?portalid=${params.portalid || "default"}`,
          {},
          "portal-login"
        );
        const data = await response.json();
        if (!data.data && response.status === 404) {
          router.push(`/${params.portalid}/not-found`);
          return;
        }
        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch portal config");
        }
        setConfig(data.data);
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
    fetchContent();
  }, []);

  // useEffect(() => {
  //   fetchContent();
  // }, [])

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleNext = async () => {
    if (validateStep()) {
      if (currentStep === 1) {
        setIsSubmitting(true);
        const userData = getUserData();
        if (contentLength >= 11) {
          completeOnboarding(userData.id);
        } else {
          router.push(`/${params.portalid}/dashboard`);
        }
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
    setTimeout(() => {
      setErrors({});
    }, 3000);
  };

  const completeOnboarding = async (id) => {
    const requestOptions = {
      method: "PUT",
      body: JSON.stringify({ id }),
    };
    const response = await fetchWrapper(
      `/api/users`,
      requestOptions,
      "changeOnboarding"
    );

    if (!response.ok) throw new Error(response.error);
    router.push(`/${params.portalid}/dashboard`);
  };

  const handleContentLengthChange = (event) => {
    setContentLength(event);
  };

  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const validateStep = () => {
    const errors = {};

    switch (currentStep) {
      case 0:
        // if (contentLength < 11)
        //   errors.contentLength = "Please add all content items.";
        break;
      case 2:
        break;
    }
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // const filterValue = (title) => {
  //   if (!content) return null;
  //   const contentItem = content.portalContent.find(
  //     (item) => item.title === title
  //   );
  //   const value = contentItem ? contentItem.value : null;

  //   if (!value) {
  //     const defaultItem = content.defaultContent.find(
  //       (item) => item.title === title
  //     );
  //     return defaultItem ? defaultItem.value : null;
  //   }
  //   return value;
  // };

  const filterContent = (title) => {
    const contentItem = content?.find((item) => item.title === title);
    const value = contentItem ? contentItem.value : title;
    return value;
  };

  const NavBarItem = ({ title }) => (
    <button className="px-6 py-2 text-text hover:text-text/80">{title}</button>
  );

  if (!config || !content) return <LoadingSpinner />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-12 w-screen min-h-screen">
      <div className="col-span-1 md:col-span-1 lg:col-span-4 bg-gray-50 bg-opacity-80 flex items-center justify-center min-h-[50vh] md:min-h-screen">
        <div className="bg-white rounded-lg w-[80%] h-[calc(100vh-120px)] flex flex-col relative">
          {/* Loading Overlay */}
          {isSubmitting && (
            <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-10 rounded-lg">
              <div className="text-center space-y-3">
                <div className="mx-auto h-8 w-8 animate-spin">
                  <div className="h-full w-full rounded-full border-4 border-gray-200 border-t-gray-800"></div>
                </div>
                <p className="text-sm text-gray-500">
                  {" "}
                  Onboarding completed successfully...
                </p>
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
            <CurrentStepComponent
              isAddRequired="true"
              onContentLengthChange={handleContentLengthChange}
              setContentOnboard={setContent}
            />
          </div>
          {errors.contentLength && (
            <div
              className="flex items-center p-4 m-4 text-sm text-red-800 border border-red-300 rounded-lg bg-red-50"
              role="alert"
            >
              <div>{errors.contentLength}</div>
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
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gray-900 hover:bg-gray-800"
                }`}
            >
              {currentStep === steps.length - 1
                ? "Save & Continue"
                : "Continue"}
            </button>
          </div>
        </div>
      </div>

      <div className="col-span-1 md:col-span-1 lg:col-span-8 h-full relative overflow-hidden bg-background min-h-[50vh] md:min-h-screen">
        <div className="max-w-[1140px] w-full pt-[50px] mx-auto">
          <nav className="flex justify-between items-center bg-secondary py-2 px-[14px]">
            <a className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
              <img
                // src="/default_logo_purple.png"
                src={config?.logo || "/logo.png"}
                alt={config.legalName || "Default"}
                className="h-[52px] mr-2"
              />
              <span className="text-3xl text-[#000000e6] mb-1 font-lato">
                {filterContent("Header Text")}
              </span>
            </a>
            <div className="hidden xl:flex space-x-4">
              <NavBarItem title="Individual" />
              <NavBarItem title="Business" />
              <NavBarItem title="About Us" />
              <NavBarItem title="Contact" />
              {/* Edit button */}
              <button className="h-5 w-5 mt-2 rounded-sm text-white bg-[#17a2b8] flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="12"
                  height="12"
                  fill="currentColor"
                >
                  <path d="M12.8995 6.85453L17.1421 11.0972L7.24264 20.9967H3V16.754L12.8995 6.85453ZM14.3137 5.44032L16.435 3.319C16.8256 2.92848 17.4587 2.92848 17.8492 3.319L20.6777 6.14743C21.0682 6.53795 21.0682 7.17112 20.6777 7.56164L18.5563 9.68296L14.3137 5.44032Z"></path>
                </svg>
              </button>
            </div>

            <button className="xl:hidden text-text">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </nav>

          <div className="flex-1 flex flex-col xl:flex-row  pt-12">
            <div className="w-full md:w-3/5 lg:w-4/5 flex flex-col justify-between bg-secondary">
              <div>
                <div className="px-[15px]">
                  <h2 className="text-[56px] font-light leading-tight text-text font-lato">
                    {filterContent("Title")}
                  </h2>
                  <div
                    style={{ backgroundColor: config?.primaryColor }}
                    className="p-[1px] w-full"
                  ></div>

                  <p className="font-light text-xl text-black leading-7 font-lato mb-3 line-clamp-5">
                    {filterContent("Paragraph")}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="w-full md:w-full lg:w-2/5 flex items-center justify-center px-[15px] mb-12">
              <div className="w-full bg-secondary rounded-md p-4 custom-shadow-sm border border-solid border-[0,0,0,.125]">
                <form>
                  <div className="">
                    <div className="rounded-sm flex items-center justify-center border border-[#f1f1f1] group mb-3 mx-5">
                      <div className="bg-[#f2f2f2] h-[42px] w-[42px] flex items-center justify-center text-gray-400 flex-shrink-0">
                        <IdCard className="h-4 w-4" />
                      </div>
                      <input
                        type="email"
                        placeholder="Email"
                        className="w-full px-4 py-2.5 text-sm rounded-sm outline-none text-text group-focus:ring-1 group-focus:ring-gray-800"
                        required
                      />
                    </div>
                    <div className="rounded-sm flex items-center justify-center border border-[#f1f1f1] group mb-5 mx-5">
                      <div className="bg-[#f2f2f2] h-[42px] w-[42px] flex items-center justify-center text-gray-400 flex-shrink-0">
                        <LockKeyhole className="h-4 w-4" />
                      </div>
                      <input
                        type="password"
                        placeholder="Password"
                        className="w-full px-4 py-2.5 text-sm rounded-sm outline-none text-text group-focus:ring-1 group-focus:ring-gray-800"
                      />
                    </div>
                    <button
                      type="button"
                      className="w-full text-black py-3 border-[#808080] p-3.5 h-16 overflow-hidden rounded-b-md border uppercase text-sm group "
                      style={{ backgroundColor: config?.secondaryColor }}
                    >
                      Log In
                    </button>
                    <button
                      type="button"
                      className="w-full text-black py-3 border-[#808080] p-3.5 h-16 overflow-hidden rounded-b-md border uppercase text-sm group mt-1"
                    >
                      Login with Okta
                    </button>
                  </div>
                </form>

                {/* <div className="text-center mt-4">
              <button className="text-text/40 hover:text-text/60">
                Forgot password?
              </button>
               </div> */}
            </div>
            </div>
          </div>

          {/* cards */}

          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3">
            <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-hidden">
              <div className="px-5 py-4">
                <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="28"
                      height="28"
                      fill="currentColor"
                    >
                      <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                    </svg>
                  </div>
                  {filterContent("Card 1 Title")}
                </h5>
                <p className="text-[#6c757d] text-sm font-normal leading-6 line-clamp-4">
                  {filterContent("Card 1 Content")}
                </p>
              </div>
            </div>

            <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-hidden">
              <div className="px-5 py-4">
                <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="28"
                      height="28"
                      fill="currentColor"
                    >
                      <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                    </svg>
                  </div>
                  {filterContent("Card 2 Title")}
                </h5>
                <p className="text-[#6c757d] text-sm font-normal leading-6 line-clamp-4">
                  {filterContent("Card 2 Content")}
                </p>
              </div>
            </div>

            <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-hidden">
              <div className="px-5 py-4">
                <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                  <div>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      width="28"
                      height="28"
                      fill="currentColor"
                    >
                      <path d="M10.9999 12L3.92886 19.0711L2.51465 17.6569L8.1715 12L2.51465 6.34317L3.92886 4.92896L10.9999 12ZM10.9999 19H20.9999V21H10.9999V19Z"></path>
                    </svg>
                  </div>
                  {filterContent("Card 3 Title")}
                </h5>
                <p className="text-[#6c757d] text-sm font-normal leading-6 line-clamp-4">
                  {filterContent("Card 3 Content")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full ">
          <Footer
            config={config}
            filterValue={filterContent}
            from={"onboarding"}
          />
        </div>
      </div>
    </div>
  );
}
