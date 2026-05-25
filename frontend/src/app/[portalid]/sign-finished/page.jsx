export default function FinishedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4f4f4]">
      <img
        src="/SignatureRequest_Finished.jpg"
        alt="Finished Illustration"
        className="max-w-full h-auto"
      />
      <div className="text-center mt-4">
        <h3 className="text-xl font-medium text-[#222] -mt-[12.5vw]">
          Thank you for completing the request
        </h3>
        <h3 className="text-lg font-medium text-[#222] mt-[0.5vw]">
          Now you can close this Model
        </h3>
      </div>
    </div>
  );
}
