import React, { useState } from 'react'
import Button from './Elements/Button';
import { X } from 'lucide-react';
import { toast } from 'react-toastify';

const CollaboratorSection = () => {
      const [isPageLoading, setIsPageLoading] = useState(false)
      const [page, setPage] = useState(null);
        const [collaborators, setCollaborators] = useState([]);
      
    const [collaborator, setCollaborator] = useState({
        email: "",
        role: "viewer",
      });
    const filterVisibility = (label) => {
        if (isPageLoading) return false; 
        if (!page || !page.length) return true;     
        
        const section = page.find((item) => item.label === label);
        return section?.visible ?? false; 
      };
      const addCollaborator = ({ email, role }) => {
          if(!email) return;
          const collaborators =
            JSON.parse(localStorage.getItem("collaborators")) || [];
          const collabExist = collaborators.find((collab) => collab.email === email);
          if (collabExist) {
            toast.error("Collaborator with same email already exist");
            return;
          }
          const collab = {
            name: email.split("@")[0],
            email: email,
            role: role,
          };
          collaborators.push(collab);
          localStorage.setItem("collaborators", JSON.stringify(collaborators));
          setCollaborators(collaborators);
          setCollaborator({
            email: "",
            role: "viewer",
          });
        };
        const removeCollaborator = (email) => {
            const collaborators =
              JSON.parse(localStorage.getItem("collaborators")) || [];
            const newList = collaborators.filter((collab) => collab.email !== email);
            localStorage.setItem("collaborators", JSON.stringify(newList));
            setCollaborators(newList);
          };
    return (
        <div className='relative'>
            {filterVisibility("Collaborator Section") && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center justify-between bg-white p-3 border-b border-gray-200 rounded-t-xl">
                        <h3 className="text-lg font-semibold text-gray-800 font-lato">
                          My Collaborators
                        </h3>
                      </div>
                      <div className="p-4">
                      <form className="mb-3.5" onSubmit={(e) => {
                        e.preventDefault(); // Prevents form from refreshing the page
                        addCollaborator(collaborator); // Calls function only when form is submitted
                      }}>
                          <input
                            type="email"
                            value={collaborator.email}
                            onChange={(e) =>
                              setCollaborator((prev) => ({
                                ...prev,
                                email: e.target.value,
                              }))
                            }
                            required
                            placeholder="user@example.com"
                            className="border border-[#dee2e6] mb-2 w-full rounded-md outline-none text-[#495057] text-base py-1.5 px-4 font-lato"
                          />

                          <div className="flex items-center gap-6">
                            <select
                              className="text-[#495057] max-w-[335px] w-full py-2  border border-[#dee2e6] px-3 rounded-md font-lato"
                              value={collaborator.role}
                              onChange={(e) =>
                                setCollaborator((prev) => ({
                                  ...prev,
                                  role: e.target.value,
                                }))
                              }
                            >
                              {/* <option>Co-Owner</option> */}
                              <option value={"editor"}>Editor</option>
                              <option value={"viewer"}>Viewer</option>
                            </select>

                            <Button 
                            //   onClick={() => addCollaborator(collaborator)}
                              type="Secondary"
                              label="Invite"
                              buttonType="Submit"
                            />
                          </div>
                        </form>

                        {/* Table */}

                        <div className="overflow-y-auto max-h-[200px]">
                          <table className="w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="text-sm font-semibold text-gray-700 font-lato p-3 text-start">
                                  Name
                                </th>
                                <th className="text-sm font-semibold text-gray-700 font-lato p-3 text-start">
                                  Email
                                </th>
                                <th className="text-sm font-semibold text-gray-700 font-lato p-3 text-start">
                                  Role
                                </th>
                                <th className="text-sm font-semibold text-gray-700 font-lato p-3 text-start">
                                  Actions
                                </th>
                              </tr>
                            </thead>

                            <tbody className="bg-white divide-y divide-gray-200">
                              <tr className="hover:bg-gray-50 transition-colors">
                                <td className="p-3">
                                  <p className="font-semibold font-lato text-sm text-gray-900">
                                    Briana Walsh
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="font-normal font-lato text-sm text-gray-600">
                                    advisor@universalportalwealth.com
                                  </p>
                                </td>
                                <td className="p-3">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    Editor
                                  </span>
                                </td>
                                <td></td>
                              </tr>
                              {collaborators &&
                                collaborators.length > 0 &&
                                collaborators.map(({ name, email, role }) => (
                                  <tr className="hover:bg-gray-50 transition-colors" key={email}>
                                    <td className="p-3">
                                      <p className="font-semibold font-lato text-sm text-gray-900">
                                        {name}
                                      </p>
                                    </td>
                                    <td className="p-3">
                                      <p className="font-normal font-lato text-sm text-gray-600">
                                        {email}
                                      </p>
                                    </td>
                                    <td className="p-3">
                                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        role === 'editor' 
                                          ? 'bg-blue-100 text-blue-800' 
                                          : 'bg-gray-100 text-gray-800'
                                      }`}>
                                        {role.charAt(0).toUpperCase() + role.slice(1)}
                                      </span>
                                    </td>
                                    <td className="p-3">
                                      <button 
                                        className="text-gray-400 hover:text-red-600 transition-colors"
                                        onClick={() => removeCollaborator(email)}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}
        </div>
    )
}

export default CollaboratorSection
