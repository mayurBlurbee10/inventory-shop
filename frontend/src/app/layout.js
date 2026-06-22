import { Bounce, ToastContainer } from "react-toastify";
import localFont from "next/font/local";
import "./globals.css";
import StoreProvider from "@/components/ReduxProvider";
import Script from "next/script";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata = {
  title: "MStrategy Portal",
  description: "A universal portal powered by MStrategy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <Script
          src="https://mstrategy-onlyoffice.azurewebsites.net/web-apps/apps/api/documents/api.js"
          strategy="lazyOnload"
        />
        {/* <SocketProvider> */}
        <StoreProvider>
          {children}
          <ToastContainer
            position="top-right"
            autoClose={1000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            transition={Bounce}
          />
        </StoreProvider>
        {/* </SocketProvider> */}
      </body>
    </html>
  );
}
