"use client"
import { useRouter } from "next/navigation";

export default function Custom404() {
  const router = useRouter();

    const handleGoBack = () => {
      router.back()
    }

  return (
    <div className="flex items-center justify-center flex-col min-h-screen bg-white">
      <div className="flex items-center sm:items-start justify-center flex-col-reverse sm:flex-row gap-x-8 p-5">
        <div className="text-center md:text-start">
          <p className="text-[4rem] sm:text-[5rem] md:text-[8rem] text-blue-600 leading-none font-semibold">
            404
          </p>
          <p className="text-sm text-black max-w-lg mb-6 leading-5">
            Oops! The page you are looking for doesn't exist.It might have been
            moved, deleted, or the URL might be incorrect.
          </p>

          <button className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition-all ease-in-out duration-200" onClick={handleGoBack}>
            Go Back
          </button>
        </div>
        <div>
          <img src="/robot.png" alt="robot" className="w-full h-full" />
        </div>
      </div>
    </div>
  );
}
