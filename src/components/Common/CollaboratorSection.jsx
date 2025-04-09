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
        <div className='reletive mt-1 mb-5'>
            {filterVisibility("Collaborator Section") && (
                    <div>
                      <div>
                        <h3 className="text-xl font-light text-center text-[#212529] font-lato mb-4">
                          My Collaborators
                        </h3>
                      </div>
                      <div className="p-4 border border-[#dee2e6]">
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
                              {/* <option>Previewer</option>
                          <option>Uploader</option>
                          <option>Previewer Uploader</option>
                          <option>Viewer Uploader</option> */}
                            </select>

                            {/* <button
                              className="py-1 px-3 bg-gray-100 rounded-md text-[#495057] border border-transparent hover:border-[#dee2e6] text-sm cursor-pointer"
                              onClick={() => addCollaborator(collaborator)}
                              type="button"
                            >
                              Invite
                            </button> */}
                            <Button 
                            //   onClick={() => addCollaborator(collaborator)}
                              type="Secondary"
                              label="Invite"
                              buttonType="Submit"
                            />
                          </div>
                        </form>

                        {/* Table */}

                        <div className="border overflow-y-auto max-h-[200px]">
                          <table className="divide-y-2 divide-gray-200 overflow-auto w-full">
                            <thead>
                              <tr>
                                <th className="text-sm text-black font-medium font-lato p-3 text-start">
                                  Name
                                </th>
                                <th className="text-sm text-black font-medium font-lato p-3 text-start">
                                  Email
                                </th>
                                <th className="text-sm text-black font-medium font-lato p-3 text-start">
                                  Role
                                </th>
                                <th className="text-sm text-black font-medium font-lato p-3 text-start">
                                  Actions
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              <tr className="hover:bg-gray-300">
                                <td className="p-3">
                                  <p className="font-semibold font-lato text-sm text-black">
                                    Erica Smith
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="font-normal font-lato text-sm text-black">
                                    advisor@wealthportal.com
                                  </p>
                                </td>
                                <td className="p-3">
                                  <p className="font-normal font-lato text-sm text-black">
                                    Editor
                                  </p>
                                </td>
                                <td></td>
                              </tr>
                              {collaborators &&
                                collaborators.length > 0 &&
                                collaborators.map(({ name, email, role }) => (
                                  <tr className="hover:bg-gray-300" key={email}>
                                    <td className="p-3">
                                      <p className="font-semibold font-lato text-sm text-black">
                                        {name}
                                      </p>
                                    </td>
                                    <td className="p-3">
                                      <p className="font-normal font-lato text-sm text-black">
                                        {email}
                                      </p>
                                    </td>
                                    <td className="p-3">
                                      <p className="font-normal font-lato text-sm text-black">
                                        {role.charAt(0).toUpperCase() +
                                          role.slice(1)}
                                      </p>
                                    </td>
                                    <td
                                      className="p-3"
                                      onClick={() => removeCollaborator(email)}
                                    >
                                      <X className="text-red-600 cursor-pointer" />
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
