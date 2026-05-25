import { OnboardingTasksType , OnboardingTasksLabel } from "../../config/constants.ts";

export const steps = [
  {
    id: "compliance",
    order: 0,
    label: "Compliance",
    description:
      "Submit the necessary details to complete your compliance onboarding",
  },
  {
    id: "transferring-your-book",
    order: 1,
    label: "Transferring Your Book",
    description:
      "Provide your book details, client list, and broker protocol information to begin the transfer process",
  },
  {
    id: "marketing",
    order: 2,
    label: "Marketing",
    description:
      "Upload your marketing materials and review project details and contracts",
  },
  {
    id: "insurance",
    order: 3,
    label: "Insurance",
    description:
      "Review the insurance process, upload documents, and complete reappointment forms",
  },
  {
    id: "dedicated-resources",
    order: 4,
    label: "Dedicated Resources",
    description:
      "Access IAA staff contacts, required disclosures (ADV 2A, 2B, Form CRS), and essential firm agreements",
  },
  {
    id: "registration-day",
    order: 5,
    label: "Registration Day",
    description:
      "Access your live day checklist, expectations, custodian team information, and SLAs",
  },
];

export const tasks = [
  {
    id: "compliance",
    order: 0,
    label: "Compliance",
    title: "Complete Compliance & Registration Forms",
    dueDate: "Jan 15, 2026",
    type: OnboardingTasksType.DOCUMENT_UPLOAD,
    taskLabel: OnboardingTasksLabel.DOCUMENT_UPLOAD,
  },
  {
    id: "registration-day",
    order: 1,
    label: "Outside Business Activities",
    title: "Outside Business Activities",
    dueDate: "Jan 20, 2026",
    type: OnboardingTasksType.SIGN,
    taskLabel: OnboardingTasksLabel.SIGN_FILEUPLOAD,
  },
  {
    id: "transferring-your-book",
    order: 2,
    label: "Marketing compliance approval for use",
    title: "Marketing compliance approval for use",
    dueDate: "Jan 25, 2026",
    type: OnboardingTasksType.NDA_SIGN,
    taskLabel: OnboardingTasksLabel.ESIGN,
  },
  {
    id: "marketing",
    order: 3,
    label: "Outside Counsel Call (if applicable)",
    title: "Outside Counsel Call (if applicable)",
    dueDate: "Feb 1, 2026",
    type: OnboardingTasksType.FORM,
    taskLabel: OnboardingTasksLabel.FORM_EDIT_SIGN,
  },
  {
    id: "insurance",
    order: 4,
    label: "Invite to dedicated Compliance Analyst",
    title: "Invite to dedicated Compliance Analyst",
    dueDate: "Feb 5, 2026",
    type: OnboardingTasksType.EDIT_SIGN,
    taskLabel: OnboardingTasksLabel.EDIT_SIGN,
  },
  {
    id: "dedicated-resources",
    order: 5,
    label: "Overview of RIA Firm Compliance Process",
    title: "Overview of RIA Firm Compliance Process",
    dueDate: "Feb 10, 2026",
    type: OnboardingTasksType.CMS,
    taskLabel: OnboardingTasksLabel.OVERVIEW,
  },
];
