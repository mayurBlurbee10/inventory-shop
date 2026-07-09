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
import { IdCard, LockKeyhole, Pen } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Input } from "@/components/ui/input";
import { toast } from "react-toastify";
import * as LucideIcons from "lucide-react";
import { coverPhotoRatio, fontSizes, logoSizeRatio } from "@/app/lib/data/font_size";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";

export default function OnBoardingPage() {
  const router = useRouter();
  const params = useParams();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contentLength, setContentLength] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
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
  const { data: contentData } = useSelector((state) => state.content);
  const [content, setContent] = useState(contentData);
  const [colors, setColors] = useState({
    primaryColor: config?.primaryColor,
    secondaryColor: config?.secondaryColor,
    accentColor: config?.accentColor,
  });
  const dispatch = useDispatch();

  const fetchContentType = async () => {
    const typesRequest = await fetchWrapper(
      `/api/contentManagement/type?portalId=${params.portalid || "root"}`,
      { method: "GET" },
      "fetch-content-type"
    );
    if (!typesRequest.ok) throw new Error("Failed to fetch Content type");
    const typesData = await typesRequest.json();
    setContentTypes(typesData);
    setOriginalContentTypes(typesData);
  };


  const fetchContent = async () => {
    try {
      setLoading(true);
      const response = await fetchWrapper(
        `/api/contentManagement?portalId=${params.portalid || "root"}`,
        { method: "GET" },
        "fetch-content-management"
      );
      if (!response.ok) throw new Error("Failed to fetch Content Management");
      const data = await response.json();
      setContent(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        dispatch(setPortal(params.portalid || 'root'))
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

  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoaderSpinner size={24} className="text-blue-500" />
    </div>
  );

  const filterContent = (title) => {
    const contentItem = content && content?.portalContent?.find((item) => item.title === title);
    let value = contentItem ? contentItem.value : null;
    if (!value) {
      const defaultItem = content.defaultContent.find(item => item.title === title);
      return defaultItem ? defaultItem.value : '';
    }
    if (title === 'Logo') {
      if (contentItem && contentItem.type === 'Image') {
        return value.replace("/api/upload", "/uploads")
      } else {
        return null
      }
    }
    if (title === 'CoverPhoto') {
      if (contentItem && contentItem.type === 'Image') {
        return value.replace("/api/upload", "/uploads")
      } else {
        return null
      }
    }
    return value;
  };

  const filterTheme = (title) => {
    const contentItem = content && content?.portalContent?.find((item) => item.title === title);
    let fontSize = fontSizes.find((item) => item.key === title)
    let theme = contentItem ? contentItem.theme : {
      fontSize: fontSize?.size,
      color: "#000000",
      fontWeight: title === 'Paragraph' ? 300 : 400,
    };
    return theme;
  };

  const handleModalOpenForEdit = (contentTitle) => {
    const contentToEdit = content && content?.portalContent?.find((item) => item.title === contentTitle);
    let value = contentToEdit ? contentToEdit.value : null;
    if (!value) {
      const defaultItem = content.defaultContent.find(item => item.title === contentTitle);
      value = defaultItem ? defaultItem.value : ''
    }
    let fontSize = fontSizes.find((item) => item.key === contentTitle)
    if (!contentToEdit) {
      const content = contentTypes.find((item) => item.title === contentTitle);
      const logoValue = contentTitle === 'Logo' && !value ? config?.logo : value
      setNewContent({
        type: content.type,
        title: contentTitle,
        fontSize: fontSize?.size,
        value: logoValue,
        theme: {
          fontSize: fontSize?.size,
          color: "#000000",
          fontWeight: contentTitle === 'Paragraph' ? 300 : 400,
        },
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

  if (!config || !content) return <LoadingSpinner />;

  const LogoImage = () => {
    const baseSize = 100; // Set a base height

    const logoSize =
      (filterTheme("Logo")?.fontSize &&
        logoSizeRatio[
        filterTheme("Logo")?.fontSize
        ]) ||
      logoSizeRatio.medium;

    return (
      <div className="block min-w-16">
        <img
          src={filterContent("Logo") || config?.logo}
          alt={params.portalid || "Default"}
          className="object-contain"
          style={{
            height: `${baseSize * logoSize}px`,
            width: "auto",
            maxWidth: "100%",
          }}
        />
      </div>
    );
  };

  const CoverPhoto = () => {
    const fontSizeKey =
      content?.portalContent?.find(item => item.title === "CoverPhoto")?.fontSize || "medium";

    const sizeInfo = coverPhotoRatio[fontSizeKey];
    const { width, height } = sizeInfo;

    const imageUrl = filterContent("CoverPhoto") || "/no_image.jpg";

    return (
      <div
        className="w-full h-auto sm:mx-auto mb-2"
        style={{
          '--cover-width': `${width / 16}rem`,
          '--cover-height': `${height / 16}rem`,
        }}
      >
        <div
          className="w-full h-auto sm:w-[var(--cover-width)] sm:h-[var(--cover-height)]"
        >
          <img
            src={imageUrl}
            alt={params.portalid || "Default"}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  };


  return (
    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-12 min-h-screen">

      {/* Preview Page */}
      <div className="col-span-1 md:col-span-1 lg:col-span-12 h-full relative overflow-hidden bg-background flex flex-col justify-between">
        <div>
          <nav className="flex justify-between items-center bg-secondary py-2 px-2 border-b" style={{backgroundColor: "hsl(var(--primary))"}}>
            <div className="max-w-[1140px] w-full mx-auto ">
              <a className="flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
                <span className="border border-dashed border-gray-400 text-black pl-3 pr-8 py-1 relative">
                  <div
                    className="absolute top-0 right-0 p-1 cursor-pointer"
                    onClick={() => handleModalOpenForEdit("Logo")}
                  >
                    <Pen className="size-4" />
                  </div>
                  <LogoImage />
                </span>

                <span
                  className="text-[#000000e6] font-lato border border-dashed border-gray-400 pl-3 pr-8 py-3 relative"
                  style={{
                    fontSize: filterTheme("Header Text").fontSize,
                    fontWeight: filterTheme("Header Text").fontWeight,
                    color: "hsl(var(--secondary-foreground))"
                  }}
                >
                  <div
                    className="absolute top-0 right-0 p-1 cursor-pointer text-secondary-foreground"
                    onClick={() => handleModalOpenForEdit("Header Text")}
                  >
                    <Pen className="size-4" />
                  </div>
                  <span className="max-w-[200px] md:max-w-[300px] lg:max-w-[350px] xl:max-w-[450px] block overflow-hidden text-ellipsis whitespace-nowrap">
                    {filterContent("Header Text")}
                  </span>
                </span>
              </a>
            </div>
          </nav>
          <div className="max-w-[1140px] w-full mx-auto">
            <div className="flex-1 flex flex-col xl:flex-row pt-12">
              <div className="w-full md:w-full lg:w-full xl:w-4/5 flex flex-col lg:justify-between bg-secondary">
                <div className="px-[15px]">
                  <h2
                    className="font-light leading-tight text-text font-lato border border-dashed border-gray-400 pl-3 pr-8 py-3 relative line-clamp-2"
                    style={{
                      fontSize: filterTheme("Title").fontSize,
                      fontWeight: filterTheme("Title").fontWeight,
                      color: "hsl(var(--secondary-foreground))"
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
                    style={{backgroundColor: "hsl(var(--primary))"}}
                    className="p-[1px] w-full my-2"
                  ></div>
                  <div className="font-lato border border-dashed text-secondary-foreground border-gray-400 pl-3 pr-8 py-3 mb-2 relative ">
                    <div
                      className="absolute top-0 right-0 p-1 cursor-pointer"
                      onClick={() => handleModalOpenForEdit("Paragraph")}
                    >
                      <Pen className="size-4" />
                    </div>
                    <p
                      className="font-light leading-7 font-lato mb-3 mt-5 line-clamp-3"
                      style={{
                        fontSize: filterTheme("Paragraph").fontSize,
                        fontWeight: filterTheme("Paragraph").fontWeight,
                        color: "hsl(var(--secondary-foreground))"
                      }}>
                      {filterContent("Paragraph")}
                    </p>
                  </div>
                  <div className="font-lato border border-dashed text-secondary-foreground border-gray-400 pl-3 pr-8 py-3 mb-2 relative flex justify-center">
                    <div
                      className="absolute top-0 right-0 p-1 cursor-pointer"
                      onClick={() => handleModalOpenForEdit("CoverPhoto")}
                    >
                      <Pen className="size-4" />
                    </div>

                    <div className="font-light leading-7 font-lato mb-3 mt-5">
                      <CoverPhoto />
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Panel - Login Form */}
              <div className="w-full md:w-full lg:w-full xl:w-2/5 flex items-center justify-center px-[15px] mb-12">
                <div className="w-full max-w-xl bg-secondary rounded-md p-4 custom-shadow-sm border border-solid border-[0,0,0,.125]">
                  <form>
                    <div className="">
                      <div className="rounded-sm flex items-center justify-center border border-[#f1f1f1] group mb-3 mx-5">
                        <div className="bg-[#f2f2f2] h-[42px] w-[42px] flex items-center justify-center text-gray-400 flex-shrink-0">
                          <IdCard className="h-4 w-4" />
                        </div>
                        <Input
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
                        <Input
                          type="password"
                          placeholder="Password"
                          className="w-full px-4 py-2.5 text-sm rounded-sm outline-none text-text group-focus:ring-1 group-focus:ring-gray-800"
                          disabled
                        />
                      </div>
                      <Button
                        type="Login"
                        label="Log In"
                        className="w-full bg-secondary-foreground text-secondary-foreground hover:bg-secondary-foreground/80"
                      />
                      <div className="w-full flex justify-center items-center">
                        <p className="text-sm text-secondary-foreground mt-2 cursor-pointer">
                          Forgot Password?
                        </p>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>

            {/* cards */}

            <div className="grid grid-cols-1 md:grid-cols-3">
              <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-gray-400 hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-auto hidden-scrollbar">
                <div className="px-5 py-4">
                  <h5 className="text-secondary-foreground font-medium mb-3 text-xl font-lato w-full flex items-center gap-3">
                    <div className="border border-dashed border-gray-400 h-10 flex items-center justify-center shrink-0">
                      <span className="text-3xl text-secondary-foreground mb-1 font-lato pl-3 pr-5 py-4 relative">
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
                          fontSize: filterTheme("Card 1 Title").fontSize,
                          fontWeight: filterTheme("Card 1 Title").fontWeight,
                          color: "hsl(var(--secondary-foreground))"
                        }}>
                        {filterContent("Card 1 Title")}
                      </div>
                    </span>
                  </h5>
                  <span className="text-secondary-foreground text-sm font-normal leading-5 line-clamp-4 border border-dashed border-gray-400 pl-3 pr-8 py-3 relative">
                    <div
                      className="absolute top-0 right-0 p-1 cursor-pointer"
                      onClick={() => handleModalOpenForEdit("Card 1 Content")}
                    >
                      <Pen className="size-4" />
                    </div>
                    <div className="line-clamp-2"
                      style={{
                        fontSize: filterTheme("Card 1 Content").fontSize,
                        fontWeight: filterTheme("Card 1 Content").fontWeight,
                        color: "hsl(var(--secondary-foreground))"
                      }}>{filterContent("Card 1 Content")}</div>
                  </span>
                </div>
              </div>

              <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-gray-400 hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-auto hidden-scrollbar">
                <div className="px-5 py-4">
                  <h5 className="text-secondary-foreground font-medium mb-3 text-xl font-lato w-full flex items-center gap-3">
                    <div className="border border-dashed border-gray-400 h-10 w-12 flex items-center justify-center shrink-0">
                      <span className="text-3xl text-secondary-foreground mb-1 font-lato pl-3 pr-5 py-4 relative">
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
                          fontSize: filterTheme("Card 2 Title").fontSize,
                          fontWeight: filterTheme("Card 2 Title").fontWeight,
                          color: "hsl(var(--secondary-foreground))"
                        }}>
                        {filterContent("Card 2 Title")}
                      </div>
                    </span>
                  </h5>
                  <span className="text-secondary-foreground text-sm font-normal leading-5 line-clamp-4 border border-dashed border-gray-400 pl-3 pr-8 py-3 relative">
                    <div
                      className="absolute top-0 right-0 p-1 cursor-pointer"
                      onClick={() => handleModalOpenForEdit("Card 2 Content")}
                    >
                      <Pen className="size-4" />
                    </div>
                    <div className="line-clamp-2"
                      style={{
                        fontSize: filterTheme("Card 2 Content").fontSize,
                        fontWeight: filterTheme("Card 2 Content").fontWeight,
                        color: "hsl(var(--secondary-foreground))"
                      }}>{filterContent("Card 2 Content")}</div>
                  </span>
                </div>
              </div>

              <div className="mx-3.5 mb-12 p-4 shadow-lg rounded-sm border border-solid border-gray-400 hover:scale-105 transition-all ease-in-out duration-150 h-[200px] overflow-auto hidden-scrollbar">
                <div className="px-5 py-4">
                  <h5 className="text-secondary-foreground font-medium mb-3 text-xl font-lato w-full flex items-center gap-3">
                    <div className="border border-dashed border-gray-400 h-10 flex items-center justify-center shrink-0">
                      <span className="text-3xl text-secondary-foreground mb-1 font-lato pl-3 pr-5 py-4 relative">
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
                          fontSize: filterTheme("Card 3 Title").fontSize,
                          fontWeight: filterTheme("Card 3 Title").fontWeight,
                          color: "hsl(var(--secondary-foreground))"
                        }}>
                        {filterContent("Card 3 Title")}
                      </div>
                    </span>
                  </h5>
                  <span className="text-secondary-foreground text-sm font-normal leading-5 line-clamp-4 border border-dashed border-gray-400 pl-3 pr-8 py-3 relative">
                    <div
                      className="absolute top-0 right-0 p-1 cursor-pointer"
                      onClick={() => handleModalOpenForEdit("Card 3 Content")}
                    >
                      <Pen className="size-4" />
                    </div>
                    <div className="line-clamp-2"
                      style={{
                        fontSize: filterTheme("Card 3 Content").fontSize,
                        fontWeight: filterTheme("Card 3 Content").fontWeight,
                        color: "hsl(var(--secondary-foreground))"
                      }}>{filterContent("Card 3 Content")}</div>
                  </span>
                </div>
              </div>
            </div>
            <div className="w-full flex gap-5 justify-end px-3">
              <Button
                onClick={() => router.push("login-preview")}
                // disabled={isSubmitting}
                label={"Preview"}
                type="Primary"
              />
              <Button
                onClick={() => router.back()}
                disabled={isSubmitting}
                label={"Continue"}
                type="Primary"
              />
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
