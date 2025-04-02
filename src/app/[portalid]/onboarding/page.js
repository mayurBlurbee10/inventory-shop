// import { ContentManagement } from "@/entities/ContentManagement";
"use client";
import { getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import Button from "@/components/Common/Elements/Button";
import AddContentModal from "@/components/Settings/AddContentModal";
import Footer from "@/components/Footer";
import ContentManagementContent from "@/components/Settings/ContentManagementContent";
import UsersContent from "@/components/Settings/UsersContent";
import { setPortal } from "@/store/services/portalService";
import { ChevronRight, Check, IdCard, LockKeyhole, User, Building, Pen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import * as LucideIcons from "lucide-react";
import { fontSizes, logoSizeMap, logoSizeRatio } from "@/app/lib/data/font_size";

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
  // const [config, setConfig] = useState([]);
  const [content, setContent] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAddRequired, setIsAddRequired] = useState(true);
  const [isUserData, setIsUserData] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [contentTypes, setContentTypes] = useState([]);
  const [originalContentTypes, setOriginalContentTypes] = useState([]);
  const [newContent, setNewContent] = useState({
    title: "",
    type: "",
    value: "",
    fontSize: "30px",
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [file, setFile] = useState(null);
  const [isContentAdded, setIsContentAdded] = useState(false)
  const [linkFields, setLinkFields] = useState([{ label: "", link: "" }]);
  const { data: config } = useSelector((state) => state.portal);
  const [colors, setColors] = useState({
    primaryColor: config?.primaryColor,
    secondaryColor: config?.secondaryColor,
    accentColor: config?.accentColor,
  });
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setColors({
      ...colors,
      [e.target.name]: e.target.value,
    });
  };
  const fetchContentType = async () => {
    const typesRequest = await fetchWrapper(
      `/api/contentManagement/type?portalId=${params.portalid ?? "default"}`,
      { method: "GET" },
      "fetchContentType"
    );
    if (!typesRequest.ok) throw new Error("Failed to fetch Content type");
    const typesData = await typesRequest.json();
    setContentTypes(typesData);
    setOriginalContentTypes(typesData);
  };

  const steps = [
    { component: ContentManagementContent },
    { component: UsersContent },
  ];
  const CurrentStepComponent = steps[currentStep].component;

  // useEffect(() => {
  //   const userData = getUserData();
  //   setIsUserData(userData)
  //   if (!userData?.isOnboardingRequired) {
  //     router.push("login");
  //   }
  // }, [router]);

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
      setContent(data?.portalContent);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // const response = await fetchWrapper(
        //   `/api/portal?portalid=${params.portalid || "default"}`,
        //   {},
        //   "portal-login"
        // );
        // const data = await response.json();
        // if (!data.data && response.status === 404) {
        //   router.push(`/${params.portalid}/not-found`);
        //   return;
        // }
        // if (!response.ok) {
        //   throw new Error(data.error || "Failed to fetch portal config");
        // }
        // setConfig(data.data);
        dispatch(setPortal(params.portalid || 'default'))
      } catch (error) {
        console.log("error: ", error);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
    fetchContent();
    fetchContentType();
  }, []);

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSave = async () => {
    // if (validateStep()) {
    //   if (currentStep === 1) {
    //     setIsSubmitting(true);
    //     const userData = getUserData();
    //     if (contentLength >= 11) {
    //       completeOnboarding(userData.id);
    //     } else {
    //       router.push(`/${params.portalid}/dashboard`);
    //     }
    //   } else {
    //     setCurrentStep(currentStep + 1);
    //   }
    // }
    const userData = getUserData();

    setIsSubmitting(true);
    if (contentLength >= 11) {
      completeOnboarding(userData.id);
    }
     try {
       const portalData = {
         ...config,
         primaryColor: colors.primaryColor,
         secondaryColor: colors.secondaryColor,
         accentColor: colors.accentColor,
       };

       const response = await fetchWrapper(
         "/api/portal",
         {
           method: "PUT",
           headers: {
             "Content-Type": "application/json",
           },
           body: JSON.stringify(portalData),
         },
         "update-portal"
       );

       if (!response.ok) throw new Error("Failed to update portal theme");

       dispatch(setPortal(params.portalid));
       router.push(`/${params.portalid}/dashboard`);
     } catch (error) {
       toast.error(error.message);
       console.log(error);
     } finally {
       setIsSubmitting(false);
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
    let value = contentItem ? contentItem.value : title;
    if(title === 'Logo'){
      if(contentItem && contentItem.type === 'Image'){
        value = value.replace("/api/upload", "/uploads")
      }else {
        value = null
      }
    }
    console.log("value", value)
    return value;
  };

  const handleModalOpenForEdit = (contentTitle) => {
    const contentToEdit = content?.find((item) => item.title === contentTitle);
    let fontSize = fontSizes.find((item) => item.key === contentTitle)
    if (!contentToEdit) {
      const content = contentTypes.find((item) => item.title === contentTitle);
      setNewContent({
        type: content.type,
        title: contentTitle,
        fontSize: fontSize?.size,
      });
      setIsDialogOpen(true);
    } else {
      setNewContent({
        ...contentToEdit,
        fontSize: contentToEdit?.fontSize || fontSize?.size,
      });
      setIsEditMode(true);
      setIsDialogOpen(true);
      setFile(null);
      if (contentToEdit?.type == "Image") {
        setPreviewUrl(contentToEdit.value || "");
      }
      if (contentToEdit?.type === "Links") {
        setLinkFields(
          JSON.parse(contentToEdit.value) || [{ label: "", link: "" }]
        );
      }
    }
  };

  const iconComponent = (title) => {
    const iconName = filterContent(title);
    const Icon = LucideIcons[iconName];

    if (!Icon) return null;

    return <Icon className="w-6 h-6 text-gray-700" />;
  }

  const NavBarItem = ({ title }) => (
    <button className="px-1 py-2 text-text hover:text-text/80">{title}</button>
  );

  if (!config || !content) return <LoadingSpinner />;

  const LogoImage = () => {
    const baseSize = 100; // Set a reasonable base size (in pixels)

    const logoSize =
      (content?.find((item) => item.title === "Logo")?.fontSize &&
        logoSizeRatio[
          content.find((item) => item.title === "Logo")?.fontSize
        ]) ||
      logoSizeRatio.medium;
    return (
      <div className="block min-w-16" >
        <img
          src={filterContent("Logo") || config?.logo}
          alt={params.portalid || "Default"}
          className="mr-2"
          style={{
            height: `${baseSize * logoSize}px`,
            width: `${baseSize * logoSize}px`,
          }}
        />
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-12 w-screen min-h-screen">
      <div className="col-span-1 md:col-span-1 lg:col-span-4 bg-gray-50 bg-opacity-80 flex justify-center min-h-[50vh] md:min-h-screen">
        <div className="bg-white w-full h-screen flex flex-col relative border-r border-[#dee2e6]">
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
          {/* <div className="px-6 py-4 border-b border-gray-200">
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
          </div> */}

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <CurrentStepComponent
              isAddRequired={isAddRequired}
              onContentLengthChange={handleContentLengthChange}
              setContentOnboard={setContent}
              userData={isUserData}
              isContentAdded={isContentAdded}
              setIsContentAdded={setIsContentAdded}
              colors={colors}
              setColors={setColors}
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
            {/* {currentStep === 0 ? (
              <div></div>
            ) : (
              // <button
              //   onClick={currentStep === 0 ? onClose : handleBack}
              //   className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-300"
              //   disabled={isSubmitting}
              //  >
              //   {currentStep === 0 ? "Cancel" : "Back"}
              // </button>
              <Button
                onClick={currentStep === 0 ? onClose : handleBack}
                disabled={isSubmitting}
                label={currentStep === 0 ? "Cancel" : "Back"}
                type="Secondary"
              />
            )} */}

            {/* <button
              onClick={handleSave}
              disabled={isSubmitting}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-gray-900 hover:bg-gray-800"
              }`}
            >
              {currentStep === steps.length - 1
                ? "Save & Continue"
                : "Continue"}
            </button> */}
            <Button
              onClick={handleSave}
              disabled={isSubmitting}
              label={"Save"}
              type="Primary"
              className="ml-auto"
            />
          </div>
        </div>
      </div>

      {/* Preview Page */}
      <div className="col-span-1 md:col-span-1 lg:col-span-8 h-full relative overflow-hidden bg-background  flex flex-col justify-between">
        <div>
          <nav className="flex justify-between items-center bg-secondary py-2 px-2 border" style={{ backgroundColor: config?.accentColor}}>
          {/* <a className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
            <img
              // src="/default_logo_purple.png"
              src={config?.logo || "/logo.png"}
              alt="Wealthportal"
              className="h-[52px] mr-2"
            />
            <span className="text-3xl text-[#000000e6] mb-1 font-lato">
              {filterValue("Header Text")}
            </span>
          </a> */}
          <a className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
              <span className="border border-dashed border-gray-400 text-black pl-3 pr-8 py-1 relative">
                <div
                  className="absolute top-0 right-0 p-1 cursor-pointer"
                  onClick={() => handleModalOpenForEdit("Logo")}
                >
                  <Pen className="size-4" />
                </div>
                {/* <div className="block min-w-16"><img
                  src={filterContent("Logo") || config?.logo}
                  alt={params.portalid || "Default"}
                  className="h-[52px] mr-2"
                  style={{
                    height:
                    logoSizeMap[
                      content?.find((item) => item.title === "Logo")?.fontSize || "medium"
                    ]
                  }}
                /></div> */}
                <LogoImage />
                {/* {filterContent("Logo")} */}
              </span>
              {/* <img
                // src="/default_logo_purple.png"
                src={config?.logo || "/logo.png"}
                alt={config.legalName || "Default"}
                className="h-[52px] mr-2"
              /> */}

              <span 
                className="text-[#000000e6] font-lato border border-dashed border-gray-400 pl-3 pr-8 py-3 relative" 
                style={{
                  fontSize:
                    content?.find((item) => item.title === "Header Text")?.fontSize || '30px',
                }}
              >
                <div
                  className="absolute top-0 right-0 p-1 cursor-pointer"
                  onClick={() => handleModalOpenForEdit("Header Text")}
                >
                  <Pen className="size-4" />
                </div>
                <span className="max-w-[250px] block overflow-hidden text-ellipsis whitespace-nowrap">
                  {filterContent("Header Text")}
                </span>
              </span>
            </a>

          {/* <div className="hidden md:flex items-center gap-x-6">
            <div className="flex items-center transition-transform transform hover:scale-105 ">
              <User className="w-5 h-5 text-gray-500 pb-[2px]" />
              <NavBarItem title="Individual" />
            </div>
            <div className="flex items-center transition-transform transform hover:scale-105 ">
              <Building className="w-5 h-5 text-gray-500 pb-[2px]" />
              <NavBarItem title="Business" />
            </div>
            <div className="flex items-center transition-transform transform hover:scale-105 ">
              <NavBarItem title="About Us" />
            </div>
            <div className="flex items-center transition-transform transform hover:scale-105 ">
              <NavBarItem title="Contact" />
            </div>

            <button className="md:hidden text-text">
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
          </div> */}
        </nav>
        <div className="max-w-[1140px] w-full mx-auto mt-10">
          <div className="flex-1 flex flex-col xl:flex-row pt-12">
            <div className="w-full md:w-3/5 lg:w-4/5 flex flex-col justify-between bg-secondary">
              <div className="px-[15px]">
                <h2 
                  className="font-light leading-tight text-text font-lato border border-dashed border-gray-400 pl-3 pr-8 py-3 relative line-clamp-2" 
                  style={{
                    fontSize:
                      content?.find((item) => item.title === "Title")?.fontSize || '56px',
                  }}>
                  <div
                    className="absolute top-0 right-0 p-1 cursor-pointer"
                    onClick={() => handleModalOpenForEdit("Title")}
                  >
                    <Pen className="size-4" />
                  </div>
                  {filterContent("Title")}
                </h2>
                <div
                  style={{ backgroundColor: config?.primaryColor }}
                  className="p-[1px] w-full my-2"
                ></div>
                <div className="font-lato border border-dashed text-[#000000e6] border-gray-400 pl-3 pr-8 py-3 mb-2 relative ">
                  <div
                    className="absolute top-0 right-0 p-1 cursor-pointer"
                    onClick={() => handleModalOpenForEdit("Paragraph")}
                  >
                    <Pen className="size-4" />
                  </div>
                  <p 
                    className="font-light leading-7 font-lato mb-3 mt-5 line-clamp-3"  
                    style={{
                          fontSize:
                            content?.find((item) => item.title === "Paragraph")?.fontSize || '20px',
                        }}>
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
                        disabled
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
                        disabled
                      />
                    </div>
                    <Button
                      type="Login"
                      label="Log In"
                    />
                    <div className="w-full flex justify-center items-center">
                      <p className="text-sm text-black mt-2 cursor-pointer">
                        Forgot Password?
                      </p>
                    </div>
                    {/* <button
                      type="button"
                      className="w-full text-black py-3 border-[#808080] p-3.5 h-16 overflow-hidden rounded-b-md border uppercase text-sm group mt-1"
                    >
                      Login with Okta
                    </button> */}
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
            <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-auto hidden-scrollbar">
              <div className="px-5 py-4">
              <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato w-full flex items-center gap-3">
                  <div className="border border-dashed border-gray-400 h-10 flex items-center justify-center shrink-0">
                     <span className="text-3xl text-[#000000e6] mb-1 font-lato pl-3 pr-5 py-4 relative">
                      <div
                        className="absolute top-2 right-0 p-1 cursor-pointer"
                        onClick={() => handleModalOpenForEdit("Card 1 Icon")}
                      >
                        <Pen className="size-4" />
                      </div>
                      {iconComponent("Card 1 Icon") || (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="28"
                          height="28"
                          fill="currentColor"
                        >
                          <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="border border-dashed border-gray-400 flex-grow pl-3 pr-8 py-1 relative">
                    <div
                      className="absolute top-0 right-0 p-1 cursor-pointer"
                      onClick={() => handleModalOpenForEdit("Card 1 Title")}
                    >
                      <Pen className="size-4" />
                    </div>
                    <div
                      className="line-clamp-2 leading-6"
                      style={{
                        fontSize: content?.find((item) => item.title === "Card 1 Title")?.fontSize || '20px',
                      }}
                    >
                      {filterContent("Card 1 Title")}
                    </div>
                  </span>
                </h5>
                <span className="text-[#6c757d] text-sm font-normal leading-5 line-clamp-4 border border-dashed border-gray-400 pl-3 pr-8 py-3 relative">
                  <div
                    className="absolute top-0 right-0 p-1 cursor-pointer"
                    onClick={() => handleModalOpenForEdit("Card 1 Content")}
                  >
                    <Pen className="size-4" />
                  </div>
                  <div className="line-clamp-2"  
                    style={{
                        fontSize:
                          content?.find((item) => item.title === "Card 1 Content")?.fontSize || '14px',
                      }}>{filterContent("Card 1 Content")}</div>
                </span>
              </div>
            </div>

            <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-auto hidden-scrollbar">
              <div className="px-5 py-4">
                <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato w-full flex items-center gap-3">
                  <div className="border border-dashed border-gray-400 h-10 w-12 flex items-center justify-center shrink-0">
                    <span className="text-3xl text-[#000000e6] mb-1 font-lato pl-3 pr-5 py-4 relative">
                      <div
                        className="absolute top-2 right-0 p-1 cursor-pointer"
                        onClick={() => handleModalOpenForEdit("Card 2 Icon")}
                      >
                        <Pen className="size-4" />
                      </div>
                      {iconComponent("Card 2 Icon") || (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="28"
                          height="28"
                          fill="currentColor"
                        >
                          <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="border border-dashed border-gray-400 flex-grow pl-3 pr-6 py-1 relative">
                    <div
                      className="absolute top-0 right-0 p-1 cursor-pointer"
                      onClick={() => handleModalOpenForEdit("Card 2 Title")}
                    >
                      <Pen className="size-4" />
                    </div>
                    <div
                      className="line-clamp-2 leading-6"
                      style={{
                        fontSize: content?.find((item) => item.title === "Card 2 Title")?.fontSize || '20px',
                      }}
                    >
                      {filterContent("Card 2 Title")}
                    </div>
                  </span>
                </h5>
                <span className="text-[#6c757d] text-sm font-normal leading-5 line-clamp-4 border border-dashed border-gray-400 pl-3 pr-8 py-3 relative">
                  <div
                    className="absolute top-0 right-0 p-1 cursor-pointer"
                    onClick={() => handleModalOpenForEdit("Card 2 Content")}
                  >
                    <Pen className="size-4" />
                  </div>
                  <div className="line-clamp-2" 
                    style={{
                        fontSize:
                          content?.find((item) => item.title === "Card 2 Content")?.fontSize || '14px',
                      }}>{filterContent("Card 2 Content")}</div>
                </span>
              </div>
            </div>

            <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-auto hidden-scrollbar">
              <div className="px-5 py-4">
              <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato w-full flex items-center gap-3">
                  <div className="border border-dashed border-gray-400 h-10 flex items-center justify-center shrink-0">
                     <span className="text-3xl text-[#000000e6] mb-1 font-lato pl-3 pr-5 py-4 relative">
                      <div
                        className="absolute top-2 right-0 p-1 cursor-pointer"
                        onClick={() => handleModalOpenForEdit("Card 3 Icon")}
                      >
                        <Pen className="size-4" />
                      </div>
                      {iconComponent("Card 3 Icon") || (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 24 24"
                          width="28"
                          height="28"
                          fill="currentColor"
                        >
                          <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                        </svg>
                      )}
                    </span>
                  </div>
                  <span className="border border-dashed border-gray-400 flex-grow pl-3 pr-8 py-1 relative">
                    <div
                      className="absolute top-0 right-0 p-1 cursor-pointer"
                      onClick={() => handleModalOpenForEdit("Card 3 Title")}
                    >
                      <Pen className="size-4" />
                    </div>
                    <div
                      className="line-clamp-2 leading-6"
                      style={{
                        fontSize: content?.find((item) => item.title === "Card 3 Title")?.fontSize || '20px',
                      }}
                    >
                      {filterContent("Card 3 Title")}
                    </div>
                  </span>
                </h5>
                <span className="text-[#6c757d] text-sm font-normal leading-5 line-clamp-4 border border-dashed border-gray-400 pl-3 pr-8 py-3 relative">
                  <div
                    className="absolute top-0 right-0 p-1 cursor-pointer"
                    onClick={() => handleModalOpenForEdit("Card 3 Content")}
                  >
                    <Pen className="size-4" />
                  </div>
                  <div className="line-clamp-2" 
                    style={{
                        fontSize:
                          content?.find((item) => item.title === "Card 3 Content")?.fontSize || '14px',
                      }}>{filterContent("Card 3 Content")}</div>
                </span>
              </div>
            </div>
          </div>
        </div>
        </div>
        <div className="w-full ">
          <Footer
            config={config}
            filterValue={filterContent}
            from={"onboarding"}
            handleModalOpenForEdit={handleModalOpenForEdit}
          />
        </div>
        {isDialogOpen && (
          <AddContentModal
            contentTypes={contentTypes}
            setContentTypes={setContentTypes}
            originalContentTypes={originalContentTypes}
            setIsDialogOpen={setIsDialogOpen}
            setIsEditMode={setIsEditMode}
            isEditMode={isEditMode}
            setNewContent={setNewContent}
            newContent={newContent}
            fetchData={fetchContent}
            file={file}
            setFile={setFile}
            previewUrl={previewUrl}
            setPreviewUrl={setPreviewUrl}
            linkFields={linkFields}
            setLinkFields={setLinkFields}
            setIsContentAdded={setIsContentAdded}
            from={"onboarding"}
          />
        )}
      </div>
    </div>
  );
}
