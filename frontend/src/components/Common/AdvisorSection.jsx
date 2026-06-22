import React from "react";

const AdvisorSection = ({
  title = "My Advisor",
  userName = "Briana Walsh",
  role = "Senior Financial Advisor",
}) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200">

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-3 border-b border-gray-200 rounded-t-xl">
        <h3 className="text-lg font-semibold text-gray-800 font-lato">
          {title}
        </h3>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start gap-6">
          <div className="max-w-[150px] w-full h-[100px] p-1 border border-gray-200 rounded-lg">
            <div
              className={`size-20 w-full h-full p-1 text-[25px] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-gray-700 rounded-lg`}
            >
              {userName?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>

          <div>
            <h2 className="font-medium text-2xl font-lato mb-1 text-[#212529] leading-none">
              {userName}
            </h2>
            <p className="font-lato text-base text-[#6c757d]">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvisorSection;
