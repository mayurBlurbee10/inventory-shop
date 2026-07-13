"use client";
import { getUserData } from "@/app/lib/auth";
import SettingsModal from "@/components/Settings";
import SignRequestModal from "@/components/SignRequestModal";
import { Bell, ChevronDown, ChevronUp, Eye, FileSignature } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { fetchWrapper } from "@/app/lib/fetchWrapper";
import { encryptMessage } from "@/app/lib/crypto";
import { useSelector } from "react-redux";
import PreviewModal from "@/components/FileExplorer/PreviewModal";
import LoaderSpinner from "@/components/Common/Elements/LoaderSpinner";
import { cn } from "@/app/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppTooltip } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarGroup } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const StatusBadge = ({ status }) =>
  status === "completed" ? (
    <Badge variant="outline" className="border-success text-success">
      Completed
    </Badge>
  ) : (
    <Badge variant="outline" className="border-warning text-warning">
      Pending
    </Badge>
  );

const TrackStatus = ({ trackedRequests }) => {
  const params = useParams();
  const [expandedRow, setExpandedRow] = useState(null);
  const [isSendReminderLoading, setIsSendReminderLoading] = useState(null);

  const { data: user } = useSelector((state) => state?.user);

  const toggleRow = (reqId) => {
    setExpandedRow(expandedRow?.id === reqId ? null : reqId);
  };

  const handleSendReminder = async (signer, signRequest) => {
    const messageData = {
      sender: user?.id,
      receiver: signer?.embedUrlExternalUserId,
      portalId: params.portalid || "root",
      subject: "Sign Document",
      text: encryptMessage(`Please sign "${signRequest?.sourceFiles[0].name}"`),
    };
    setIsSendReminderLoading(signer?.embedUrlExternalUserId);
    try {
      const response = await fetchWrapper(
        "/api/messages",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(messageData),
        },
        "create-message"
      );

      if (!response.ok) throw new Error("Failed to send message");
      toast.success("Reminder sent successfully");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSendReminderLoading(null);
    }
  };

  return (
    <div className="p-4">
      {trackedRequests?.length > 0 ? (
        <div className="rounded-lg border border-border">
          <Table className="table-fixed">
            <TableHeader className="sticky top-0 z-10 bg-muted/60">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-1/3">Document</TableHead>
                <TableHead className="w-1/4">Signers</TableHead>
                <TableHead className="w-1/6">Status</TableHead>
                <TableHead className="w-1/6" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {trackedRequests.map((req) => {
                const signers = req?.signers?.filter(
                  (signer) => req.senderEmail !== signer.email
                );

                return signers.length > 0 ? (
                  <React.Fragment key={req.id}>
                    {/* Default Row */}
                    {req.sourceFiles.length > 0 && (
                      <TableRow
                        className={cn(
                          expandedRow?.id === req?.id && "border-b-0"
                        )}
                      >
                        {/* Document Name */}
                        <TableCell className="truncate font-medium text-foreground">
                          {req?.sourceFiles[0]?.name ||
                            req?.rawData?.source_files[0]?.name}
                        </TableCell>

                        {/* Signers Initials */}
                        <TableCell>
                          <AvatarGroup>
                            {signers.map((signer, index) => (
                              <Avatar key={index} size="sm">
                                <AvatarFallback className="font-semibold">
                                  {signer?.email[0].toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </AvatarGroup>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge
                            status={
                              signers.some(
                                (signer) =>
                                  signer?.signerDecision === null &&
                                  signer.role !== "final_copy_reader"
                              )
                                ? "pending"
                                : "completed"
                            }
                          />
                        </TableCell>

                        {/* Expand Button */}
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() =>
                              toggleRow((prev) =>
                                prev?.id === req?.id ? null : req
                              )
                            }
                            aria-label="Toggle signer details"
                          >
                            {expandedRow?.id === req?.id ? (
                              <ChevronUp />
                            ) : (
                              <ChevronDown />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Expanded Rows */}
                    {expandedRow?.id === req.id &&
                      signers.map((signer, idx) => (
                        <TableRow key={`${req.id}-${signer.email}`}>
                          {idx === 0 && (
                            <TableCell rowSpan={signers.length} />
                          )}

                          {/* Signer Email */}
                          <TableCell className="text-muted-foreground">
                            {signer?.email}
                          </TableCell>

                          {/* Status */}
                          <TableCell colSpan={2}>
                            {signer?.signerDecision !== null ? (
                              <StatusBadge status="completed" />
                            ) : (
                              <div className="flex items-center gap-2">
                                <StatusBadge status="pending" />
                                <AppTooltip label="Send Reminder">
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label="Send Reminder"
                                    onClick={() =>
                                      handleSendReminder(signer, expandedRow)
                                    }
                                  >
                                    {isSendReminderLoading ===
                                    signer?.embedUrlExternalUserId ? (
                                      <LoaderSpinner
                                        size={18}
                                        className="text-secondary-foreground"
                                      />
                                    ) : (
                                      <Bell className="text-muted-foreground" />
                                    )}
                                  </Button>
                                </AppTooltip>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </React.Fragment>
                ) : null;
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="p-3 text-center text-muted-foreground">
          No pending requests
        </p>
      )}
    </div>
  );
};

function ESignature() {
  const router = useRouter();
  const params = useParams();
  const [accountDropdown, setAccountDropdown] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [trackedRequests, setTrackedRequest] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewFileId, setPreviewFileId] = useState(false);
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedSignUrl, setSelectedSignUrl] = useState(null);
  const { data: user } = useSelector((state) => state.user);
  const { data: pages } = useSelector((state) => state.pages);

  useEffect(() => {
    const page = pages?.find((page) => page.title === "esignature");
    if (page && !page.isPageVisible) {
      router.push("access-denied");
    }
  }, []);

  const handlePreview = (fileId) => {
    setPreviewFileId(fileId);
    setIsPreviewModalOpen(true);
  };

  const fetchConfig = async () => {
    try {
      if (!params?.portalid) return;
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const fetchSignRequests = async (userData) => {
    try {
      if (!userData) return;
      setIsLoading(true);
      const response = await fetchWrapper(`/api/box/e-sign?userId=${userData?.id}`);
      const data = await response.json();
      if (response.ok) {
        setPendingRequests(data.data.pending);
        setCompletedRequests(data.data.completed);
        setTrackedRequest(data.data.tracked);
      } else {
        console.error("Failed to fetch sign requests");
      }
    } catch (error) {
      console.error("Error fetching sign requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignClick = (signReq) => {
    const currentUserReq = signReq.signers.find(
      (item) => item.email === user.email
    );
    if (currentUserReq) {
      setSelectedSignUrl(currentUserReq.iframeableEmbedUrl);
      setIsSignModalOpen(true);
    }
  };

  useEffect(() => {
    const userData = getUserData();
    fetchConfig();
    if (!isSignModalOpen) {
      fetchSignRequests(userData);
    }
  }, [router]);

  const LoadingSpinner = () => (
    <div className="flex h-[80vh] items-center justify-center bg-background">
      <LoaderSpinner size={32} className="text-secondary-foreground" />
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const tabs = [
    {
      key: "pending",
      label: `Pending Requests (${pendingRequests?.length || 0})`,
    },
    {
      key: "completed",
      label: `Completed Requests (${completedRequests?.length || 0})`,
    },
    { key: "track_status", label: "Track Status" },
  ];

  return (
    <div className="mx-auto w-full max-w-[1140px] px-1 sm:px-4">
      <Card
        className="w-full overflow-hidden"
        onClick={() => setAccountDropdown(false)}
      >
        {/* Header */}
        <CardHeader className="flex-row items-center gap-3 border-b border-border bg-gradient-to-r from-muted/50 to-card p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-secondary-foreground">
            <FileSignature className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <CardTitle className="text-lg">E-signature</CardTitle>
            <CardDescription>
              Securely execute an eSignature workflow, including document
              preparation, and digital signing.
            </CardDescription>
          </div>
        </CardHeader>

        {/* Tabs + Content */}
        <CardContent className="p-0">
          {/* Tabs */}
          <div className="flex flex-wrap gap-1 border-b border-border bg-muted/30 px-2 pt-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors sm:text-base",
                  activeTab === tab.key
                    ? "border-primary-solid text-secondary-foreground bg-background rounded-t-lg"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Display List of Requests */}
          {isLoading ? (
            <div className="flex min-h-[400px] items-center justify-center sm:min-h-[500px]">
              <LoaderSpinner size={32} className="text-secondary-foreground" />
            </div>
          ) : (
            <div className="h-[550px] overflow-y-auto overflow-x-auto bg-background scrollbar-hide">
              {activeTab === "pending" && (
                <div>
                  {pendingRequests?.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {pendingRequests.map((req) => (
                        <React.Fragment key={req.id}>
                          {req.sourceFiles.length > 0 && (
                            <li className="flex items-center justify-between gap-3 px-4 py-3">
                              <span className="truncate font-semibold text-foreground">
                                {req?.sourceFiles[0]?.name ||
                                  req?.rawData?.source_files[0]?.name}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="font-semibold text-secondary-foreground"
                                onClick={() => handleSignClick(req)}
                              >
                                Sign
                              </Button>
                            </li>
                          )}
                        </React.Fragment>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-8 text-center text-muted-foreground">
                      No pending requests
                    </p>
                  )}
                </div>
              )}

              {activeTab === "completed" && (
                <div>
                  {completedRequests?.length > 0 ? (
                    <ul className="divide-y divide-border">
                      {completedRequests?.map((req) => (
                        <li
                          key={req.id}
                          className="flex items-center justify-between gap-3 px-4 py-3 bg-background"
                        >
                          <span className="truncate font-semibold text-foreground">
                            {req?.signFiles.files[0]?.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              handlePreview(req?.signFiles.files[0]?.id)
                            }
                            aria-label="Preview document"
                          >
                            <Eye className="text-muted-foreground" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="p-8 text-center text-muted-foreground">
                      No completed requests
                    </p>
                  )}
                </div>
              )}

              {activeTab === "track_status" && (
                <TrackStatus trackedRequests={trackedRequests} />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
      <SignRequestModal
        isOpen={isSignModalOpen}
        onClose={() => {
          setIsSignModalOpen(false);
          fetchSignRequests(user);
        }}
        signUrl={selectedSignUrl}
      />
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        fileId={previewFileId}
      />
    </div>
  );
}

export default ESignature;
