import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { COMPLAINT_CATEGORIES, STATUS_CONFIG } from "@/lib/complaints";
import type { ComplaintStatus, ComplaintCategory } from "@/lib/complaints";
import { LogOut, RefreshCw, ChevronDown, ChevronUp, FileText, Clock, Trash2, MessageSquare } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ComplaintRow {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  created_at: string;
  updated_at: string;
  file_urls: string[] | null;
}

interface StatusHistoryRow {
  id: string;
  status: ComplaintStatus;
  note: string | null;
  created_at: string;
}

interface CommentRow {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const AdminDashboard = () => {
  const { user, isAdmin, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState<ComplaintRow[]>([]);
  const [fetching, setFetching] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [statusHistory, setStatusHistory] = useState<Record<string, StatusHistoryRow[]>>({});
  const [comments, setComments] = useState<Record<string, CommentRow[]>>({});
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  // Update state
  const [newStatus, setNewStatus] = useState<Record<string, ComplaintStatus>>({});
  const [newNote, setNewNote] = useState<Record<string, string>>({});
  const [personalRemark, setPersonalRemark] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate("/admin/login", { replace: true });
    }
  }, [user, isAdmin, loading, navigate]);

  const fetchComplaints = async () => {
    setFetching(true);
    let query = supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter as ComplaintStatus);
    }
    if (categoryFilter !== "all") {
      query = query.eq("category", categoryFilter as ComplaintCategory);
    }

    const { data, error } = await query;
    if (error) {
      toast.error("Failed to fetch complaints");
    } else {
      setComplaints((data || []) as ComplaintRow[]);
    }
    setFetching(false);
  };

  useEffect(() => {
    if (user && isAdmin) fetchComplaints();
  }, [user, isAdmin, statusFilter, categoryFilter]);

  const fetchHistory = async (complaintId: string) => {
    const { data } = await supabase
      .from("complaint_status_history")
      .select("*")
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: true });
    setStatusHistory((prev) => ({ ...prev, [complaintId]: (data || []) as StatusHistoryRow[] }));
  };

  const fetchComments = async (complaintId: string) => {
    const { data } = await supabase
      .from("complaint_comments")
      .select("*")
      .eq("complaint_id", complaintId)
      .order("created_at", { ascending: false });
    setComments((prev) => ({ ...prev, [complaintId]: (data || []) as CommentRow[] }));
  };

  const toggleExpand = (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      if (!statusHistory[id]) fetchHistory(id);
      if (!comments[id]) fetchComments(id);
    }
  };

  const updateStatus = async (complaint: ComplaintRow) => {
    const status = newStatus[complaint.id];
    if (!status) return;

    const combinedNote = [
      newNote[complaint.id],
      personalRemark[complaint.id] ? `[Remark] ${personalRemark[complaint.id]}` : "",
    ]
      .filter(Boolean)
      .join(" | ") || null;

    const { error: updateError } = await supabase
      .from("complaints")
      .update({ status })
      .eq("id", complaint.id);

    if (updateError) {
      toast.error("Failed to update status");
      return;
    }

    const { error: historyError } = await supabase
      .from("complaint_status_history")
      .insert({
        complaint_id: complaint.id,
        status,
        note: combinedNote,
        changed_by: user!.id,
      });

    if (historyError) {
      toast.error("Status updated but failed to record history");
    } else {
      toast.success("Status updated!");
    }

    setNewStatus((prev) => ({ ...prev, [complaint.id]: undefined as unknown as ComplaintStatus }));
    setNewNote((prev) => ({ ...prev, [complaint.id]: "" }));
    setPersonalRemark((prev) => ({ ...prev, [complaint.id]: "" }));
    fetchComplaints();
    fetchHistory(complaint.id);
  };

  const deleteComplaint = async (complaint: ComplaintRow) => {
    await supabase.from("complaint_status_history").delete().eq("complaint_id", complaint.id);
    const { error } = await supabase.from("complaints").delete().eq("id", complaint.id);

    if (error) {
      toast.error("Failed to delete complaint");
    } else {
      toast.success("Complaint deleted successfully");
      if (expandedId === complaint.id) setExpandedId(null);
      fetchComplaints();
    }
  };

  const deleteComment = async (commentId: string, complaintId: string) => {
    const { error } = await supabase.from("complaint_comments").delete().eq("id", commentId);
    if (error) {
      toast.error("Failed to delete comment");
    } else {
      toast.success("Comment deleted");
      fetchComments(complaintId);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!user || !isAdmin) return null;

  const stats = {
    total: complaints.length,
    received: complaints.filter((c) => c.status === "received").length,
    in_review: complaints.filter((c) => c.status === "in_review").length,
    resolved: complaints.filter((c) => c.status === "resolved").length,
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Authorities Dashboard</h1>
          <p className="text-sm text-muted-foreground">Receive, review, and resolve complaints</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchComplaints}>
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { signOut(); navigate("/"); }}>
            <LogOut className="h-4 w-4 mr-1" /> Sign Out
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, cls: "bg-card" },
          { label: "Received", value: stats.received, cls: "bg-info/10" },
          { label: "In Review", value: stats.in_review, cls: "bg-warning/10" },
          { label: "Resolved", value: stats.resolved, cls: "bg-success/10" },
        ].map((s) => (
          <Card key={s.label} className={s.cls}>
            <CardContent className="pt-4 pb-4 text-center">
              <p className="text-2xl font-bold text-foreground">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="in_review">In Review</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {COMPLAINT_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Complaints list */}
      <div className="space-y-4">
        {fetching ? (
          <div className="text-center py-12 text-muted-foreground">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No complaints found.</div>
        ) : (
          complaints.map((c) => (
            <motion.div key={c.id} layout>
              <Card className="overflow-hidden">
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => toggleExpand(c.id)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{c.title}</p>
                      <p className="text-xs text-muted-foreground font-mono">{c.tracking_id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                      {COMPLAINT_CATEGORIES.find((cat) => cat.value === c.category)?.label}
                    </Badge>
                    <Badge className={STATUS_CONFIG[c.status].color}>
                      {STATUS_CONFIG[c.status].label}
                    </Badge>
                    {expandedId === c.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {expandedId === c.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="border-t border-border"
                  >
                    <div className="p-4 space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Description</p>
                        <p className="text-sm text-foreground bg-muted/30 rounded-lg p-3 whitespace-pre-wrap">{c.description}</p>
                      </div>

                      <div className="flex gap-6 text-sm flex-wrap">
                        <div>
                          <p className="text-xs text-muted-foreground">Category</p>
                          <p className="text-foreground">{COMPLAINT_CATEGORIES.find((cat) => cat.value === c.category)?.label}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Submitted</p>
                          <p className="text-foreground">{new Date(c.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Last Updated</p>
                          <p className="text-foreground">{new Date(c.updated_at).toLocaleString()}</p>
                        </div>
                      </div>

                      {/* Status history */}
                      {statusHistory[c.id] && statusHistory[c.id].length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> Status History
                          </p>
                          <div className="space-y-2">
                            {statusHistory[c.id].map((h) => (
                              <div key={h.id} className="flex items-center gap-2 text-xs">
                                <Badge className={`${STATUS_CONFIG[h.status].color} text-[10px] px-1.5 py-0`}>
                                  {STATUS_CONFIG[h.status].label}
                                </Badge>
                                <span className="text-muted-foreground">{new Date(h.created_at).toLocaleString()}</span>
                                {h.note && <span className="text-foreground">— {h.note}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Student Comments */}
                      {comments[c.id] && comments[c.id].length > 0 && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" /> Student Comments ({comments[c.id].length})
                          </p>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {comments[c.id].map((cm) => (
                              <div key={cm.id} className="flex items-start justify-between bg-muted/30 rounded-md px-3 py-2 text-xs">
                                <div>
                                  <span className="font-medium text-foreground">{cm.author_name}</span>
                                  <span className="text-muted-foreground ml-2">{new Date(cm.created_at).toLocaleString()}</span>
                                  <p className="text-foreground/80 mt-0.5">{cm.content}</p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                                  onClick={() => deleteComment(cm.id, c.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Update status + personal remark */}
                      <div className="border-t border-border pt-4">
                        <p className="text-sm font-medium text-foreground mb-2">Take Action</p>
                        <div className="space-y-3">
                          <div className="flex gap-3 flex-wrap">
                            <Select
                              value={newStatus[c.id] || ""}
                              onValueChange={(v) => setNewStatus((prev) => ({ ...prev, [c.id]: v as ComplaintStatus }))}
                            >
                              <SelectTrigger className="w-[160px]">
                                <SelectValue placeholder="New status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="received">Received</SelectItem>
                                <SelectItem value="in_review">In Review</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              disabled={!newStatus[c.id]}
                              onClick={() => updateStatus(c)}
                            >
                              Update Status
                            </Button>
                          </div>
                          <Textarea
                            placeholder="Public note (visible in tracking timeline)..."
                            className="min-h-[60px]"
                            rows={2}
                            value={newNote[c.id] || ""}
                            onChange={(e) => setNewNote((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          />
                          <Textarea
                            placeholder="Personal remark (internal note, saved with status history)..."
                            className="min-h-[60px] border-accent/30"
                            rows={2}
                            value={personalRemark[c.id] || ""}
                            onChange={(e) => setPersonalRemark((prev) => ({ ...prev, [c.id]: e.target.value }))}
                          />
                        </div>
                      </div>

                      {/* Delete complaint */}
                      <div className="border-t border-border pt-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" className="gap-1">
                              <Trash2 className="h-4 w-4" /> Delete Complaint
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete this complaint?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete complaint <span className="font-mono font-bold">{c.tracking_id}</span> and all its history & comments. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteComplaint(c)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </motion.div>
                )}
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
