import React from "react";

const AdvisorSection = ({
  title = "My Advisor",
  userName = "Briana Walsh",
  role = "Senior Financial Advisor",
}) => {
  return (
    <div className="mb-7">
      <div>
        <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
          {title}
        </h3>
      </div>

      <div className="border border-[#dee2e6] shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-start gap-6 p-4 ">
          <div className="max-w-[150px] w-full h-[100px] p-1 border border-[#dee2e6] ">
            {/* <a className="p-1 rounded-sm cursor-pointer flex items-center border border-[#dee2e6]">
              <img src="https://images.unsplash.com/photo-1498529605908-f357a9af7bf5?auto=format&fit=crop&w=1950&q=60&ixid=dW5zcGxhc2guY29tOzs7Ozs%3D" />
            </a> */}
            <div
              className={`size-20 w-full h-full p-1 text-[25px] flex items-center justify-center text-white shadow-sm transition-transform hover:scale-105 bg-gray-700`}
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
        {/* <div className="px-5 py-3 flex items-center justify-center bg-gray-100">
        <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
          Meet
        </button>
        <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
          Call
        </button>
        <button className="px-2 text-sm text-[#6c757d] font-lato mx-3">
          Chat
        </button>
      </div> */}
      </div>
    </div>
  );
};

export default AdvisorSection;
