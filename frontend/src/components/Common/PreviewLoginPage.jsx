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
          
              return <Icon className="h-7 w-7 text-secondary-foreground" />;
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
                <nav className="flex items-center justify-between border-b border-border bg-primary px-2 py-2">
                    <div className="mx-auto min-h-[70px] w-full max-w-[1140px]">
                        <a className="flex items-center gap-2 px-[18px] py-1 transition-all duration-300 ease-in-out hover:scale-105">
                            {user?.company?.logo || config?.logo ? (
                                <LogoImage />
                            ) : (
                                <div className="mr-2 h-[52px] w-[52px] animate-pulse rounded bg-muted" />
                            )}

                            <span
                                className="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap font-lato text-3xl text-secondary-foreground md:max-w-[300px] lg:max-w-[350px] xl:max-w-[450px]"
                                style={{
                                    fontSize: filterTheme("Header Text").fontSize,
                                    fontWeight: filterTheme("Header Text").fontWeight,
                                    color: "hsl(var(--secondary-foreground))",
                                    lineHeight: "1.2",
                                    paddingInline: "2px"
                                }}
                            >
                                {content?.portalContent === undefined ? (
                                    <span className="block h-[50px] w-[200px] animate-pulse rounded bg-muted" />
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
                        <div className="flex w-full flex-col justify-between bg-secondary md:w-full lg:w-full xl:w-4/5">
                            <div>
                                <div className="px-[15px]">
                                    <h2
                                        className="mb-2 font-lato font-light leading-tight text-secondary-foreground"
                                        style={{
                                            fontSize: filterTheme("Title").fontSize,
                                            fontWeight: filterTheme("Title").fontWeight,
                                            color: "hsl(var(--secondary-foreground))"
                                          }}>
                                        {filterValue("Title")}
                                    </h2>
                                    <div className="my-2 h-px w-full bg-[var(--primary-solid)]" />

                                    <p
                                        className="mb-3 mt-5 font-lato font-light leading-7 text-secondary-foreground"
                                        style={{
                                            fontSize: filterTheme("Paragraph").fontSize,
                                            fontWeight: filterTheme("Paragraph").fontWeight,
                                            color: "hsl(var(--secondary-foreground))"
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
                        <div className="mb-12 mt-5 flex w-full items-center justify-center px-[15px] md:mt-0 md:w-full lg:w-full xl:w-2/5">
                            <div className="custom-shadow-sm w-full max-w-xl rounded-md border border-border bg-card p-4">
                                <form>
                                    <div>
                                        <div className="group mx-5 mb-3 flex items-center justify-center overflow-hidden rounded-sm border border-border">
                                            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center bg-muted text-muted-foreground">
                                                <IdCard className="h-4 w-4" />
                                            </div>
                                            <input
                                                type="email"
                                                placeholder="Email"
                                                className="w-full rounded-sm bg-background px-4 py-2.5 text-sm text-secondary-foreground outline-none placeholder:text-muted-foreground"
                                                readOnly
                                            />
                                        </div>
                                        <div className="group mx-5 mb-5 flex items-center justify-center overflow-hidden rounded-sm border border-border">
                                            <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center bg-muted text-muted-foreground">
                                                <LockKeyhole className="h-4 w-4" />
                                            </div>
                                            <input
                                                type="password"
                                                placeholder="Password"
                                                className="w-full rounded-sm bg-background px-4 py-2.5 text-sm text-secondary-foreground outline-none placeholder:text-muted-foreground"
                                                readOnly
                                            />
                                        </div>
                                        <Button
                                            type="Login"
                                            label="Log In"
                                            className="w-full bg-primary-solid text-primary-foreground hover:bg-primary-solid/80"
                                        />
                                        <div className="mt-2 flex w-full cursor-pointer items-center justify-center text-sm text-muted-foreground hover:text-primary">
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
                            <div className="mx-3.5 mb-5 rounded-sm border border-border bg-card p-4 shadow-lg transition-all duration-150 ease-in-out hover:scale-105">
                                <div className="px-5 py-4">
                                    <h5 className="mb-3 flex items-center justify-start gap-3 font-lato text-xl font-medium text-secondary-foreground">
                                        <div className="text-secondary-foreground">
                                            {iconComponent("Card 1 Icon") || (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    width="28"
                                                    height="28"
                                                    fill="currentColor"
                                                    className="text-secondary-foreground"
                                                >
                                                    <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                                                </svg>
                                            )}
                                        </div>
                                        <div
                                             style={{
                                                fontSize: filterTheme("Card 1 Title").fontSize,
                                                fontWeight: filterTheme("Card 1 Title").fontWeight,
                                                color: "hsl(var(--secondary-foreground))"
                                              }}>{filterValue("Card 1 Title")}</div>
                                    </h5>
                                    <p className="font-normal leading-6 text-muted-foreground"  style={{
                                                    fontSize: filterTheme("Card 1 Content").fontSize,
                                                    fontWeight: filterTheme("Card 1 Content").fontWeight,
                                                    color: "hsl(var(--secondary-foreground))"
                                                    }}>
                                        {filterValue("Card 1 Content")}
                                    </p>
                                </div>
                            </div>
                            <div className="mx-3.5 mb-5 rounded-sm border border-border bg-card p-4 shadow-lg transition-all duration-150 ease-in-out hover:scale-105">
                                <div className="px-5 py-4">
                                    <h5 className="mb-3 flex items-center justify-start gap-3 font-lato text-xl font-medium text-secondary-foreground">
                                        <div className="text-secondary-foreground">
                                            {iconComponent("Card 2 Icon") || (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    width="28"
                                                    height="28"
                                                    fill="currentColor"
                                                    className="text-secondary-foreground"
                                                >
                                                    <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                                                </svg>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: filterTheme("Card 2 Title").fontSize,
                                                fontWeight: filterTheme("Card 2 Title").fontWeight,
                                                color: "hsl(var(--secondary-foreground))"
                                              }}>{filterValue("Card 2 Title")}</div>
                                    </h5>
                                    <p className="font-normal leading-6 text-muted-foreground" style={{
                                                    fontSize: filterTheme("Card 2 Content").fontSize,
                                                    fontWeight: filterTheme("Card 2 Content").fontWeight,
                                                    color: "hsl(var(--secondary-foreground))"
                                                    }}>
                                        {filterValue("Card 2 Content")}
                                    </p>
                                </div>
                            </div>
                            <div className="mx-3.5 mb-5 rounded-sm border border-border bg-card p-4 shadow-lg transition-all duration-150 ease-in-out hover:scale-105">
                                <div className="px-5 py-4">
                                    <h5 className="mb-3 flex items-center justify-start gap-3 font-lato text-xl font-medium text-secondary-foreground">
                                        <div className="text-secondary-foreground">
                                            {iconComponent("Card 3 Icon") || (
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 24 24"
                                                    width="28"
                                                    height="28"
                                                    fill="currentColor"
                                                    className="text-secondary-foreground"
                                                >
                                                    <path d="M5 3V19H21V21H3V3H5ZM19.9393 5.93934L22.0607 8.06066L16 14.1213L13 11.121L9.06066 15.0607L6.93934 12.9393L13 6.87868L16 9.879L19.9393 5.93934Z"></path>
                                                </svg>
                                            )}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: filterTheme("Card 3 Title").fontSize,
                                                fontWeight: filterTheme("Card 3 Title").fontWeight,
                                                color: "hsl(var(--secondary-foreground))"
                                              }}>{filterValue("Card 3 Title")}</div>
                                    </h5>
                                    <p className="font-normal leading-6 font-lato text-muted-foreground" style={{
                                                            fontSize: filterTheme("Card 3 Content").fontSize,
                                                            fontWeight: filterTheme("Card 3 Content").fontWeight,
                                                            color: "hsl(var(--secondary-foreground))"
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
