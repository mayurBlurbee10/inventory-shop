"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const getInitials = (name) => {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0]?.charAt(0)?.toUpperCase() || "U";
};

const AdvisorSection = ({
  title = "My Advisor",
  userName = "Briana Walsh",
  role = "Senior Financial Advisor",
}) => {
  return (
    <Card className="overflow-hidden rounded-xl border-border bg-card shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 rounded-t-xl border-b border-border bg-card p-3">
        <CardTitle className="font-lato text-lg font-semibold text-foreground">
          {title}
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="flex items-start gap-6">
          <div className="h-[100px] w-full max-w-[150px] rounded-lg border border-border p-1">
            <Avatar className="h-full w-full rounded-lg bg-primary text-primary-foreground shadow-sm transition-transform hover:scale-105">
              <AvatarFallback className="rounded-lg bg-primary text-2xl font-semibold text-primary-foreground">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="min-w-0">
            <h2 className="mb-1 font-lato text-2xl font-medium leading-none text-foreground">
              {userName}
            </h2>
            <p className="font-lato text-base text-muted-foreground">{role}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdvisorSection;
