import { CarFront, User } from "lucide-react";
import React from "react";

const loanData = [
  {
    id: 1,
    icon: CarFront,
    name: "Auto - 635789",
    type: "Auto",
    status: "Active",
  },
  {
    id: 2,
    icon: User,
    name: "Personal - 990154",
    type: "Personal",
    status: "Fully Paid",
  },
];

function LoansPage() {
  return (
    <div className="bg-white rounded-lg flex relative w-full h-[80vh] max-w-[1140px] mx-auto text-gray-700">
      <div className="flex border-b border-[#dee2e6]">
        <h1>Loan Origination</h1>
        <span>
          Securely execute a loan origination workflow, including application,
          document ingestion, and eSignature.
        </span>
      </div>
      <div>
        <h1>My Loans</h1>

        <table>
          <thead>
            <tr>
              <th></th>
              <th>Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}

export default LoansPage;
