"use client";
import { SignJWT } from "jose";
import { useEffect, useRef } from "react";

export default function FileEditorPage() {
  const editorRef = useRef(null);

  const getFile = async () => {
    try {
      const secretKey = new TextEncoder().encode(
        "OKxRd0yUnWvX0Ai6py9UjULFiOOyqL"
      );
    //   const secretKey = new TextEncoder().encode(
    //     "9bce206dc17d48548d37a329732a3c88"
    //   );
      const tokenPayload = {
        document: {
          fileType: "docx",
          key: "1786867357999",
          title: "Resume.docx",
          url: "https://mstrategygroup-demo.box.com/shared/static/t7l2b5wpiidhz9nxml6b1t4maah8sxoc.docx",
          permissions: { edit: true, download: true },
        },
        documentType: "word",
        editorConfig: {
          customization: {
            autoSave: true,
            uiTheme: "default-light",
            features: { tabBackground: { mode: "toolbar" } },
          },
        },
      };

      const token = await new SignJWT(tokenPayload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setExpirationTime("1h")
        .sign(secretKey);

      editorRef.current = new window.DocsAPI.DocEditor("onlyoffice-editor", {
        ...tokenPayload,
        token,
        // height: "100vh",
        width: "100%",
      });
    } catch (error) {
      console.error("Error loading file:", error);
      toast.error("Error loading document.");
    }
  };

  useEffect(() => {
    getFile();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="bg-gray-50 flex-1">
        <div className="w-[100vw] h-[100vh]">
          <div
            id="onlyoffice-editor"
            ref={editorRef}
            className="h-full w-full"
            style={{ height: "100vh !important" }}
          ></div>
        </div>
      </div>
    </div>
  );
}
