import { Bounce, ToastContainer } from "react-toastify";
import localFont from "next/font/local";
import "./globals.css";
import ReduxProvider from "@/components/ReduxProvider";
import StoreProvider from "@/components/ReduxProvider";
import { SocketProvider } from "@/context/SocketProvider";

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
      <head>
        <script type="text/javascript" src="https://0705d950.docs.onlyoffice.com/web-apps/apps/api/documents/api.js" strategy="lazyOnload"></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      > 
      {/* <SocketProvider> */}
          <StoreProvider>
            {children}
            <ToastContainer
              position="top-right"
              autoClose={3000}
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
