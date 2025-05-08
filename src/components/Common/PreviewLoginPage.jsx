"use client";
import React from 'react'
import Footer from '../Footer';
import { useSelector } from 'react-redux';
import { IdCard, LockKeyhole } from 'lucide-react';
import * as LucideIcons from "lucide-react";
import Button from './Elements/Button';
import { coverPhotoRatio, fontSizes, logoSizeRatio } from '@/app/lib/data/font_size';
import { useParams, useRouter } from 'next/navigation';

const PreviewLoginPage = () => {
    const params = useParams();
    const router = useRouter();
    const { data: config } = useSelector((state) => state.portal);
    const { data: content } = useSelector((state) => state.content);
    const { data: user } = useSelector((state) => state.user);

    const filterValue = (title) => {
        if (!content) return null;
        const contentItem = content && content?.portalContent.find(
          (item) => item.title === title
        );
        const value = contentItem ? contentItem.value : null;
    
        if (!value) {
          const defaultItem = content && content?.defaultContent.find(
            (item) => item.title === title
          );
          return defaultItem ? defaultItem.value : null;
        }
        return value;
      };

      const LogoImage = () => {
          const baseSize = 100; // Set a reasonable base size (in pixels)
      
          const logoSize =
            (filterTheme("Logo")?.fontSize &&
                logoSizeRatio[
                filterTheme("Logo")?.fontSize
                ]) ||
            logoSizeRatio.medium;
          return (
            <div className="block min-w-16">
              <img
                src={config?.logo || "/logo.png"}
                alt={params.portalid}
                className="object-contain mr-2"
                  style={{
                    height: `${baseSize * logoSize}px`, 
                    width: "auto",                      
                    maxWidth: "100%",                  
                }}
              />
            </div>
          );
        };

        const iconComponent = (title) => {
              const iconName = filterValue(title);
              const Icon = LucideIcons[iconName];
          
              if (!Icon) return null;
          
              return <Icon className="w-7 h-7 text-gray-700" />;
            }

            const CoverPhoto = () => {
                const fontSizeKey =
                  content?.portalContent?.find(item => item.title === "CoverPhoto")?.fontSize || "medium";
              
                const sizeInfo = coverPhotoRatio[fontSizeKey];
                const { width, height } = sizeInfo;
              
                const imageUrl = filterValue("CoverPhoto") || "/no_image.jpg";
              
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
              
    const filterTheme = (title) => {
      const contentItem =
        content && content?.portalContent?.find((item) => item.title === title);
      let fontSize = fontSizes.find((item) => item.key === title);
      let theme = contentItem
        ? contentItem.theme
        : {
            fontSize: fontSize?.size,
            color: "#000000",
            fontWeight: title === 'Paragraph' ? 300 : 400,
          };
      return theme;
    };        

    return (
        <div className="min-h-screen bg-background flex flex-col justify-between">
            <div>
                <nav className="flex justify-between items-center bg-secondary py-2 px-2 border-b" style={{ backgroundColor: config?.accentColor }}>
                    <div className="max-w-[1140px] w-full mx-auto min-h-[70px]">
                        <a className=" flex items-center py-1 px-[18px] gap-2 hover:scale-105 transition-all ease-in-out duration-300">
                            {user?.company?.logo || config?.logo ? (
                                <LogoImage />
                            ) : (
                                <div className="h-[52px] w-[52px] mr-2 bg-gray-300 animate-pulse rounded" />
                            )}

                            <span
                                className="text-3xl text-[#000000e6] font-lato overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] md:max-w-[300px] lg:max-w-[350px] xl:max-w-[450px]"
                                style={{
                                    fontSize: filterTheme("Header Text").fontSize,
                                    fontWeight: filterTheme("Header Text").fontWeight,
                                    color: filterTheme("Header Text").color,
                                    lineHeight: "1.2",
                                    paddingInline: "2px"
                                }}
                            >
                                {content?.portalContent === undefined ? (
                                    <span className="w-[200px] h-[50px] bg-gray-200 animate-pulse rounded block"></span>
                                ) : filterValue("Header Text") &&
                                    filterValue("Header Text") !== "Premier Customer Portal" ? (
                                    filterValue("Header Text")
                                ) : (
                                    params?.portalid
                                )}
                            </span>
                        </a>
                    </div>
                </nav>
                <div className="max-w-[1140px] w-full mx-auto mt-10">
                    <div className="flex-1 flex flex-col xl:flex-row">
                        <div className="w-full md:w-full lg:w-full xl:w-4/5 flex flex-col justify-between bg-secondary">
                            <div>
                                <div className="px-[15px]">
                                    <h2
                                        className="font-light leading-tight text-text font-lato mb-2" style={{
                                            fontSize: filterTheme("Title").fontSize,
                                            fontWeight: filterTheme("Title").fontWeight,
                                            color: filterTheme("Title").color
                                          }}>
                                        {filterValue("Title")}
                                    </h2>
                                    <div
                                        style={{ backgroundColor: config?.primaryColor }}
                                        className="p-[1px] w-full"
                                    ></div>

                                    <p
                                        className="font-light text-black leading-7 font-lato mb-3 mt-5"
                                        style={{
                                            fontSize: filterTheme("Paragraph").fontSize,
                                            fontWeight: filterTheme("Paragraph").fontWeight,
                                            color: filterTheme("Paragraph").color
                                          }}>
                                        {filterValue("Paragraph")}
                                    </p>
                                    <div className='w-full flex justify-center'>
                                        {filterValue("CoverPhoto") && (
                                            <div className="pl-3 pr-3 py-3 mb-2 relative flex justify-center">
                                                <CoverPhoto />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Panel - Login Form */}
                        <div className="w-full md:w-full lg:w-full xl:w-2/5 flex items-center justify-center px-[15px] mb-12 mt-5 md:mt-0">
                            <div className="w-full max-w-xl bg-secondary rounded-md p-4 custom-shadow-sm border border-solid border-[0,0,0,.125]">
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
                                                readOnly
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
                                                readOnly
                                            />
                                        </div>
                                        <Button
                                            type="Login"
                                            label="Log In"
                                        />
                                        <div className="w-full flex justify-center items-center text-sm mt-2 text-black hover:text-blue-700  cursor-pointer">
                                            <p>
                                                Forgot Password?
                                            </p>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* cards */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-3 py-5">
                            <div className="mx-3.5 mb-5 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
                                <div className="px-5 py-4">
                                    <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                                        <div>
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
                                        </div>
                                        <div
                                             style={{
                                                fontSize: filterTheme("Card 1 Title").fontSize,
                                                fontWeight: filterTheme("Card 1 Title").fontWeight,
                                                color: filterTheme("Card 1 Title").color
                                              }}>{filterValue("Card 1 Title")}</div>
                                    </h5>
                                    <p className="text-[#6c757d] font-normal leading-6"  style={{
                                                    fontSize: filterTheme("Card 1 Content").fontSize,
                                                    fontWeight: filterTheme("Card 1 Content").fontWeight,
                                                    color: filterTheme("Card 1 Content").color
                                                    }}>
                                        {filterValue("Card 1 Content")}
                                    </p>
                                </div>
                            </div>
                            <div className="mx-3.5 mb-5 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
                                <div className="px-5 py-4">
                                    <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                                        <div>
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
                                        </div>
                                        <div
                                            style={{
                                                fontSize: filterTheme("Card 2 Title").fontSize,
                                                fontWeight: filterTheme("Card 2 Title").fontWeight,
                                                color: filterTheme("Card 2 Title").color
                                              }}>{filterValue("Card 2 Title")}</div>
                                    </h5>
                                    <p className="text-[#6c757d] font-normal leading-6" style={{
                                                    fontSize: filterTheme("Card 2 Content").fontSize,
                                                    fontWeight: filterTheme("Card 2 Content").fontWeight,
                                                    color: filterTheme("Card 2 Content").color
                                                    }}>
                                        {filterValue("Card 2 Content")}
                                    </p>
                                </div>
                            </div>
                            <div className="mx-3.5 mb-5 p-4 shadow-lg rounded-sm border border-solid border-[#00000020] hover:scale-105 transition-all ease-in-out duration-150">
                                <div className="px-5 py-4">
                                    <h5 className="text-[#212529] font-medium mb-3 text-xl font-lato flex items-center justify-start gap-3">
                                        <div>
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
                                        </div>
                                        <div
                                            style={{
                                                fontSize: filterTheme("Card 3 Title").fontSize,
                                                fontWeight: filterTheme("Card 3 Title").fontWeight,
                                                color: filterTheme("Card 3 Title").color
                                              }}>{filterValue("Card 3 Title")}</div>
                                    </h5>
                                    <p className="text-[#6c757d] font-normal leading-6 font-lato" style={{
                                                            fontSize: filterTheme("Card 3 Content").fontSize,
                                                            fontWeight: filterTheme("Card 3 Content").fontWeight,
                                                            color: filterTheme("Card 3 Content").color
                                                            }}>
                                        {filterValue("Card 3 Content")}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='w-full flex justify-end px-3'>
                        <Button
                            onClick={() => router.back()}
                            label={"Back"}
                            type="Primary"
                        />
                    </div>
                </div>
            </div>
            <div>
                <Footer config={config} filterValue={filterValue} />
            </div>
        </div>
    );
}

export default PreviewLoginPage
