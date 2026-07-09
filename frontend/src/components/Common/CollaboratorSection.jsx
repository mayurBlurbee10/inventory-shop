import React, { useState } from 'react'
// OLD custom button: import Button from './Elements/Button';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
    const renderRoleBadge = (role) => (
      <Badge variant={role === 'editor' ? 'default' : 'secondary'} className="bg-priamry text-foreground ">
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );

    return (
        <div className='relative'>
            {filterVisibility("Collaborator Section") && (
                    <Card className="overflow-hidden p-0">
                      {/* Header */}
                      <div className="flex items-center justify-between bg-card p-3 border-b border-border rounded-t-xl">
                        <h3 className="text-lg font-semibold text-foreground font-lato">
                          My Collaborators
                        </h3>
                      </div>
                      <div className="p-4">
                      <form className="mb-3.5" onSubmit={(e) => {
                        e.preventDefault(); // Prevents form from refreshing the page
                        addCollaborator(collaborator); // Calls function only when form is submitted
                      }}>
                          <Input
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
                            className="mb-2 w-full h-10 py-1.5 px-4 text-foreground font-lato"
                          />

<div className="flex items-stretch gap-4">
  <Select
    value={collaborator.role}
    onValueChange={(value) =>
      setCollaborator((prev) => ({ ...prev, role: value }))
    }
  >
    <SelectTrigger className="w-full max-w-[335px] !bg-background !h-10 font-lato">
      <SelectValue placeholder="Select role" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="editor">Editor</SelectItem>
      <SelectItem value="viewer">Viewer</SelectItem>
    </SelectContent>
  </Select>

  <Button type="submit" variant="secondary" className="px-3 py-2">
    Invite
  </Button>
</div>
                        </form>

                        {/* Table */}

                        <div className="overflow-y-auto max-h-[200px]">
                          <Table>
                            <TableHeader className="bg-muted">
                              <TableRow>
                                <TableHead className="text-sm font-semibold text-muted-foreground font-lato p-3 text-start">
                                  Name
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-muted-foreground font-lato p-3 text-start">
                                  Email
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-muted-foreground font-lato p-3 text-start">
                                  Role
                                </TableHead>
                                <TableHead className="text-sm font-semibold text-muted-foreground font-lato p-3 text-start">
                                  Actions
                                </TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              <TableRow>
                                <TableCell className="p-3">
                                  <p className="font-semibold font-lato text-sm text-foreground">
                                    Briana Walsh
                                  </p>
                                </TableCell>
                                <TableCell className="p-3">
                                  <p className="font-normal font-lato text-sm text-muted-foreground">
                                    advisor@universalportalwealth.com
                                  </p>
                                </TableCell>
                                <TableCell className="p-3">
                                  {renderRoleBadge('editor')}
                                </TableCell>
                                <TableCell></TableCell>
                              </TableRow>
                              {collaborators &&
                                collaborators.length > 0 &&
                                collaborators.map(({ name, email, role }) => (
                                  <TableRow key={email}>
                                    <TableCell className="p-3">
                                      <p className="font-semibold font-lato text-sm text-foreground">
                                        {name}
                                      </p>
                                    </TableCell>
                                    <TableCell className="p-3">
                                      <p className="font-normal font-lato text-sm text-muted-foreground">
                                        {email}
                                      </p>
                                    </TableCell>
                                    <TableCell className="p-3">
                                      {renderRoleBadge(role)}
                                    </TableCell>
                                    <TableCell className="p-3">
                                      <button
                                        type="button"
                                        className="text-muted-foreground hover:text-destructive transition-colors"
                                        onClick={() => removeCollaborator(email)}
                                      >
                                        <X className="h-4 w-4" />
                                      </button>
                                    </TableCell>
                                  </TableRow>
                                ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </Card>
                  )}
        </div>
    )
}

export default CollaboratorSection
