"use client";

import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import { setLoans } from "@/store/services/loanService";
import {
  CarFront,
  ChevronDown,
  Home,
  Plus,
  RotateCw,
  Search,
  User,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { cn } from "@/app/lib/utils";
import { AppTooltip } from "@/components/ui/tooltip";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const getStatusBadgeClass = (status) => {
  if (status === "Fully Paid") return "border-success text-success";
  if (status === "Active") return "border-primary-solid text-secondary-foreground";
  return "border-warning text-warning";
};

function LoansPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const { data: loanData } = useSelector((state) => state.loans);
  const { data: pages } = useSelector((state) => state.pages);
  const dispatch = useDispatch();

  useEffect(() => {
    const page = pages?.find((page) => page.title === "forms");
    if (page && !page.isPageVisible) {
      router.push("access-denied");
    }
  }, []);

  useEffect(() => {
    // dispatch(setLoans(loanData?.length < 3 ? defaultLoanData : loanData));
    dispatch(setLoans(loanData));
  }, []);

  const handleRefresh = () => {
    // dispatch(setLoans(loanData?.length === 3 ? loanData.slice(1) : loanData));
    dispatch(setLoans(loanData));
  };

  const LoadingSpinner = () => (
    <div className="flex h-[80vh] items-center justify-center bg-background">
      <LoaderSpinner size={32} className="text-secondary-foreground" />
    </div>
  );

  if (!loanData) {
    return <LoadingSpinner />;
  }
  const filteredLoanData = loanData?.filter((loan) =>
    loan.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative mx-auto flex w-full max-w-[540px] flex-col text-foreground md:max-w-[720px] lg:max-w-[1140px]">
      <div>
        {/* Header */}
        <Card className="mb-6 mt-12">
          <CardHeader className="flex-row items-start justify-between gap-3 border-b border-border bg-gradient-to-r from-muted/50 to-card p-4 rounded-lg">
            <div className="min-w-0">
              <CardTitle className="text-lg">Custom Forms</CardTitle>
              <CardDescription>
                Create new forms and collect new data from customers, partners
                and employees and route as required.
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button type="button" variant="outline" size="lg" className="px-3 py-3" />}
              >
                <Plus className="h-4 w-4" />
                <span className="font-medium">Create New</span>
                <ChevronDown className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => router.push(`forms/new?type=mortgage`)}
                >
                  Mortgage
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`forms/new?type=auto`)}
                >
                  Auto
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push(`forms/new?type=personal`)}
                >
                  Personal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
        </Card>
      </div>

      {/* Search + Refresh */}
      <div className="flex flex-col pt-8">
        <div className="flex items-center justify-end pb-5">
          <AppTooltip label="Refresh">
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:text-destructive"
              onClick={handleRefresh}
              aria-label="Refresh"
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </AppTooltip>
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search forms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-11 pl-10"
          />
        </div>
      </div>

      {/* Forms Table */}
      <Card className="mt-6 overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/60">
            <TableRow className="hover:bg-transparent">
              <TableHead className="px-4 font-semibold text-foreground">Forms</TableHead>
              <TableHead className="px-4 font-semibold text-foreground">Name</TableHead>
              <TableHead className="px-4 font-semibold text-foreground">Type</TableHead>
              <TableHead className="px-4 font-semibold text-foreground">Status</TableHead>
              <TableHead className="px-4 font-semibold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLoanData?.length > 0 ? (
              filteredLoanData?.map(({ id, icon, name, type, status }) => (
                <TableRow key={id}>
                  <TableCell className="px-4 py-3">
                    <div className="flex items-center justify-center">
                      {icon === "CarFront" && (
                        <CarFront className="size-8 text-muted-foreground" />
                      )}
                      {icon === "Home" && (
                        <Home className="size-8 text-muted-foreground" />
                      )}
                      {icon === "User" && (
                        <User className="size-8 text-muted-foreground" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 font-medium text-foreground">
                    {name}
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge variant="secondary" className="capitalize">
                      {type}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(getStatusBadgeClass(status))}
                    >
                      {status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="px-2 font-medium text-secondary-foreground hover:text-muted-foreground hover:underline"
                      onClick={() => router.push(`forms/details/${id}`)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow className="hover:bg-transparent">
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center">
                    <p className="text-base">No forms found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

export default LoansPage;
