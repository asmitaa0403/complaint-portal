export const COMPLAINT_CATEGORIES = [
  { value: "academic", label: "Academic Issues" },
  { value: "harassment", label: "Harassment" },
  { value: "infrastructure", label: "Infrastructure" },
  { value: "administration", label: "Administration" },
  { value: "faculty_behavior", label: "Faculty Behavior" },
  { value: "student_conduct", label: "Student Conduct" },
  { value: "financial", label: "Financial / Fee Related" },
  { value: "safety", label: "Safety & Security" },
  { value: "other", label: "Other" },
] as const;

export type ComplaintCategory = typeof COMPLAINT_CATEGORIES[number]["value"];

export type ComplaintStatus = "received" | "in_review" | "resolved" | "closed";

export const STATUS_CONFIG: Record<ComplaintStatus, { label: string; color: string }> = {
  received: { label: "Received", color: "bg-info text-info-foreground" },
  in_review: { label: "In Review", color: "bg-warning text-warning-foreground" },
  resolved: { label: "Resolved", color: "bg-success text-success-foreground" },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground" },
};

export function generateTrackingId(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const prefix = "ALU";
  let id = "";
  for (let i = 0; i < 8; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return `${prefix}-${id}`;
}
