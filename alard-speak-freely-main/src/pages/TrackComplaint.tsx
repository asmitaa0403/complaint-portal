import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { STATUS_CONFIG, COMPLAINT_CATEGORIES } from "@/lib/complaints";
import type { ComplaintStatus } from "@/lib/complaints";
import { supabase } from "@/integrations/supabase/client";
import { Search, Clock, CheckCircle2, AlertCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
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

interface ComplaintResult {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  created_at: string;
}

interface StatusHistoryEntry {
  id: string;
  status: ComplaintStatus;
  note: string | null;
  created_at: string;
}

const TrackComplaint = () => {
  const [trackingId, setTrackingId] = useState("");
  const [result, setResult] = useState<ComplaintResult | null | "not_found">(null);
  const [statusHistory, setStatusHistory] = useState<StatusHistoryEntry[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    setSearched(true);

    const { data: complaint } = await supabase
      .from("complaints")
      .select("*")
      .eq("tracking_id", trackingId.trim().toUpperCase())
      .single();

    if (!complaint) {
      setResult("not_found");
      return;
    }

    setResult(complaint as ComplaintResult);

    const { data: history } = await supabase
      .from("complaint_status_history")
      .select("*")
      .eq("complaint_id", complaint.id)
      .order("created_at", { ascending: true });

    setStatusHistory((history || []) as StatusHistoryEntry[]);
  };

  const handleDelete = async () => {
    if (!result || result === "not_found") return;

    await supabase
      .from("complaint_status_history")
      .delete()
      .eq("complaint_id", result.id);

    const { error } = await supabase
      .from("complaints")
      .delete()
      .eq("id", result.id);

    if (error) {
      toast.error("Failed to delete complaint. Please try again.");
    } else {
      toast.success("Complaint deleted successfully.");
      setResult(null);
      setStatusHistory([]);
      setSearched(false);
      setTrackingId("");
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Search className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Track Your Complaint</h1>
            <p className="text-sm text-muted-foreground">Enter your tracking ID to check the status.</p>
          </div>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                placeholder="Enter tracking ID (e.g., ALU-XXXXXXXX)"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
                className="font-mono text-base"
              />
              <Button type="submit" variant="default">Search</Button>
            </form>
          </CardContent>
        </Card>

        {searched && result === "not_found" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-destructive/30">
              <CardContent className="pt-6 flex items-center gap-4">
                <AlertCircle className="h-8 w-8 text-destructive shrink-0" />
                <div>
                  <p className="font-semibold text-foreground">Complaint Not Found</p>
                  <p className="text-sm text-muted-foreground">
                    No complaint found with this tracking ID. Please check and try again.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {searched && result && result !== "not_found" && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <CardTitle className="font-display text-xl">{result.title}</CardTitle>
                    <CardDescription className="font-mono">{result.tracking_id}</CardDescription>
                  </div>
                  <Badge className={STATUS_CONFIG[result.status].color}>
                    {STATUS_CONFIG[result.status].label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Category</p>
                    <p className="font-medium text-foreground">
                      {COMPLAINT_CATEGORIES.find((c) => c.value === result.category)?.label}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Submitted</p>
                    <p className="font-medium text-foreground">
                      {new Date(result.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm text-foreground bg-muted/50 rounded-lg p-4 whitespace-pre-wrap">{result.description}</p>
                </div>

                {statusHistory.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-3">Status Timeline</p>
                    <div className="space-y-3">
                      {statusHistory.map((entry, i) => (
                        <div key={entry.id} className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {i === statusHistory.length - 1 ? (
                              <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : (
                              <Clock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              {STATUS_CONFIG[entry.status].label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(entry.created_at).toLocaleString()}
                            </p>
                            {entry.note && (
                              <p className="text-xs text-muted-foreground mt-1">{entry.note}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                          This will permanently delete your complaint <span className="font-mono font-bold">{result.tracking_id}</span>. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default TrackComplaint;