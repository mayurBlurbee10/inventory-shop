"use client";
import {getUserData } from "@/app/lib/auth";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { getSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { setPortal } from "@/store/services/portalService";
import { useDispatch, useSelector } from "react-redux";
import { setCurrentUser } from "@/store/services/userService";
import { setContent } from "@/store/services/contentService";

function Container({ children }) {
  const params = useParams();
  const router = useRouter();

  const { data: config } = useSelector((state) => state.portal);
  const { data: content } = useSelector((state) => state.content);
  const dispatch = useDispatch()

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) return;

      // setConfig(data.data);
      dispatch(setPortal(params.portalid))
      dispatch(setContent(params.portalid))
    } catch (error) {
      console.log("error: ", error);
    }
  };

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, portalid: params.portalid }),
      };
      const response = await fetchWrapper(url, body, "fetch-user-by-email");
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
      fetchConfig();
    });
  }, [router]);

  return (
    <div
      className="bg-white min-h-screen overflow-y-auto flex flex-col justify-between font-lato"
      suppressHydrationWarning={true}
    >
      {/* Header */}
      <div>
        <Navbar
          content={content}
          config={config}
          filterValue={filterValue}
        />
        <div className="min-h-[80vh]" >{children}</div>
      </div>
      <Footer config={config} filterValue={filterValue} />
    </div>
  );
}

export default Container;
