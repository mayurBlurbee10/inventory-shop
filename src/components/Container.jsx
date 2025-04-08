"use client";
import { clearUserData, getUserData, setUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getSession, signOut } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { setPortal } from "@/store/services/portalService";
import { useDispatch, useSelector } from "react-redux";
import { setFiles } from "@/store/services/fileService";
import { setCurrentUser } from "@/store/services/userService";

function Container({ children }) {
  const params = useParams();
  const router = useRouter();
  // const [user, setUser] = useState(null);
  // const [config, setConfig] = useState(null);
  // const [content, setContent] = useState(null);

  const { data: config } = useSelector((state) => state.portal);
  const { data: content } = useSelector((state) => state.content);
  const dispatch = useDispatch()

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) return;
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
      //   throw new Error("Failed to fetch users");
      // }

      // setConfig(data.data);
      dispatch(setPortal(params.portalid))
    } catch (error) {
      console.log("error: ", error);
    }
  };

  
  // const getFiles = async () => {
  //   try {
  //     const userData = getUserData();
  //     if (!userData) return;
  //     dispatch(setFiles(userData?.boxFolderId))
  //   } catch (error) {
  //     console.error("Error fetching files:", error);
  //     return [];
  //   }
  // };

  // const fetchContent = async () => {
  //   const response = await fetchWrapper(
  //     `/api/contentManagement?portalId=${params.portalid}`,
  //     { method: "GET" },
  //     "fetchContentManagement"
  //   );
  //   const data = await response.json();
  //   if (!response.ok) {
  //     throw new Error(data.error || "Failed to fetch Content Management");
  //   }
  //   setContent(data);
  // };

  const filterValue = (title) => {
    if (!content) return null;

    const contentItem = content.portalContent.find(
      (item) => item.title === title
    );
    const value = contentItem ? contentItem.value : null;

    if (!value) {
      const defaultItem = content.defaultContent.find(
        (item) => item.title === title
      );
      return defaultItem ? defaultItem.value : null;
    }
    return value;
  };

  const getUserDetailsByEmail = async (email) => {
    try {
      let url = `/api/users/loginByProvider`;
      const body = {
        method: "POST",
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetchUserByEmail");
      if (!response.ok) throw new Error("Failed to get user from email");
      const data = await response.json();
      const userData = data.user;
      // setUserData(userData);
      dispatch(setCurrentUser(userData))
      // localStorage.setItem("portal", params.portalid);
      localStorage.setItem("accessToken", data.accessToken);
    } catch (error) {
      console.error("Failed to get user from email:", error);
      router.push("login");
    }
  };

  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession();
      if (sessionData) {
        await getUserDetailsByEmail(sessionData.user.email);
      }
    };
    fetchSession().then(() => {
      const userData = getUserData();
      if (!userData) {
        router.push("login");
        return;
      }

      // setUser(userData);
      fetchConfig();
      // fetchContent();
      // getFiles()
    });
  }, [router]);

  return (
    <div
      className="bg-white min-h-screen overflow-y-auto flex flex-col justify-between"
      suppressHydrationWarning={true}
    >
      {/* Header */}
      <Navbar
        content={content}
        config={config}
        filterValue={filterValue}
      />
       <div className="min-h-[80vh]" >{children}</div>
      <Footer config={config} filterValue={filterValue} />
    </div>
  );
}

export default Container;
