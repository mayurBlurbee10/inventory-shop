export const UserRole = {
  USER: "user",
  ADMIN: "admin",
  SUPER_ADMIN: "super_admin",
  MASTER: "master",
  MODERATOR: "moderator",
};

export const PluginType = {
  PAGES: "pages",
  TNC: "t&c",
};

export const TaskType = {
  GENERAL: "general",
  SIGN: "sign",
  UPLOAD: "upload",
};

export const TaskStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
};

export const DocumentStatus = {
  SUBMITTED: "submitted",
  REVIEWED: "reviewed",
  PENDING: "pending",
};

export const EmailType = {
  FILE_UPLOAD: "file_upload",
  LOGIN_CODE: "login_code",
  INVITE_LINK: "invite_link",
  RESEND_INVITE: "resend_invite",
  WORKFLOW_DOCUMENT_UPLOAD_NOTIFICATION:
    "workflow_document_upload_notification",
  WORKFLOW_DOCUMENT_REJECT_NOTIFICATION:
    "workflow_document_reject_notification",
  WORKFLOW_DOCUMENT_REUPLOAD_NOTIFICATION:
    "workflow_document_reupload_notification",
};

export const ApplicationStatus = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
};

export enum PageStatus {
  DRAFT = "draft",
  PENDING_APPROVAL = "pending_approval",
  APPROVED = "approved",
  PENDING_PUBLISH = "pending_publish",
  PUBLISHED = "published",
  REJECTED = "rejected",
}

export enum WidgetType {
  RICHTEXT = "richtext",
  IMAGE = "image",
  CARD = "card",
  VIDEO = "video",
  DOCLINKS = "doc-links",
  FEEDS = "feeds",
  QUICKLINKS = "quick-links",
  APP_LAUNCH = "app-launch",
  MY_CONNECTIONS = "my-connections",
  TASKS = "tasks",
  TRAINING_CERTIFICATION = "training-certification",
  CALENDAR = "calendar",
  PROFILE_CARD = "profile-card",
  PROFILE_ACTIVITY = "profile-activity",
  HUMAN_RESOURCES = "human-resources",
  HERO_SECTION = "hero-section",
  COMPANY_NEWS = "company-news",
  COMPANY_RESOURCES = "company-resources",
  RESOURCES = "resources",
}

export enum NotificationStatus {
  UNREAD = "unread",
  READ = "read",
}

export enum NotificationType {
  MESSAGE = "message",
  TASK = "task",
  SYSTEM = "system",
  FORM_REVIEW_REQUEST = "form_review_request",
  FORM_APPROVED = "form_approved",
  FORM_REJECTED = "form_rejected",
  FORM_PUBLISH_REQUEST = "form_publish_request",
  FORM_PUBLISHED = "form_published",
  FORM_UNPUBLISHED = "form_unpublished",
  FORM_ARCHIVED = "form_archived",
  FORM_UNARCHIVED = "form_unarchived",
  FORM_ASSIGNED = "form_assigned",
  FORM_COMPLETED = "form_completed",
}

export const NotificationConfigure = {
  WELCOME_LOGIN_EMAIL: "welcome_login_email",
  INVITE_LINK_EMAIL: "invite_link_email",
};

export const OnboardingTasksStatus = {
  PENDING: "pending",
  COMPLETED: "completed",
};

export const OnboardingTasksType = {
  DOCUMENT_UPLOAD: "document_upload",
  SIGN: "sign",
  NDA_SIGN: "nda_sign",
  FORM: "form",
  EDIT_SIGN: "edit_sign",
  CMS: "cms",
};

export const OnboardingTasksLabel = {
  DOCUMENT_UPLOAD: "documents",
  OVERVIEW: "overview",
  ESIGN: "esign",
  FORM_EDIT_SIGN: "form + edit + esign",
  EDIT_SIGN: "edit + esign",
  SIGN_FILEUPLOAD: "sign + fileupload",
};

export enum WorkflowType {
  CLIENT_CUSTOMER_ONBOARDING = "client_customer_onboarding",
  EMPLOYEE_ONBOARDING = "employee_onboarding",
  VENDOR_PARTNER_ONBOARDING = "vendor_partner_onboarding",
  PRODUCT_SERVICE_ENROLLMENT = "product_service_enrollment",
  COMPLIANCE_LEGAL_INTAKE = "compliance_legal_intake",
  OTHER_CUSTOM_PROCESS = "other_custom_process",
}

export enum TemplateSubtaskType {
  SIGN = "sign",
  FORM = "form",
  UPLOAD = "upload",
  DOWNLOAD = "download",
  VIEW = "view",
  EDIT = "edit",
  CMS = "cms",
  // APPROVAL = "approval",
  // PAYMENT = "payment",
  // CUSTOM = "custom",
}

export enum assignedToType {
  CLIENT_END_USER = "client_end_user",
  PORTAL_MANAGER = "portal_manager",
  SPECIFIC_ROLE = "specific_role",
}

export enum completionRule {
  ALL_SUBTASKS = "all_subtasks_completed",
  ALL_REQUIRED_SUBTASKS = "all_required_subtasks_completed",
  ANY_ONE_SUBTASK = "any_one_subtask_completed",
  MANAGER_MARKS_COMPLETE = "manager_marks_complete",
}

export enum WorkflowInstanceStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  PAUSED = "paused",
  CANCELLED = "cancelled",
}
export const ChannelType = {
  EMAIL: "email",
  IN_APP: "in-app",
};

export const TriggerType = {
  TASK_COMPLETED: "task_completed",
  TASK_ASSIGNED: "task_assigned",
  DUE_DATE_REMINDER: "due_date_reminder",
  NEW_USER_JOINED: "new_user_joined",
  FORM_SUBMITTED: "form_submitted",
};

export const RecipientType = {
  TASK_CREATOR: "task_creator",
  TASK_ASSIGNEE: "task_assignee",
  SPECIFIC_USERS: "specific_users",
  PORTAL_ROLE: "portal_role",
  PORTAL_SCOPE: "portal_scope",
};

export const NotificationVariables = {
  task_completed: ["recipient_name", "task_name", "completed_by", "date"],
  new_user_joined: ["user_name", "user_email", "user_role", "joined_at", "invited_by", "date"],
  task_assigned: ["recipient_name", "task_name", "assigned_to", "assigned_by", "assigned_at"],
};
