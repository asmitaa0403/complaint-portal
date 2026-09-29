import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { COMPLAINT_CATEGORIES, generateTrackingId } from "@/lib/complaints";
import type { ComplaintCategory } from "@/lib/complaints";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Upload, CheckCircle2, Copy } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const SubmitComplaint = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [trackingId, setTrackingId] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    const tid = generateTrackingId();

    const { error: insertError } = await supabase
      .from("complaints")
      .insert({
        tracking_id: tid,
        title: title.trim(),
        description: description.trim(),
        category: category as ComplaintCategory,
        file_urls: files.length > 0 ? files.map((f) => f.name) : null,
      });

    if (insertError) {
      toast.error("Failed to submit complaint. Please try again.");
      setSubmitting(false);
      return;
    }

    // Also insert initial status history
    const { data: complaint } = await supabase
      .from("complaints")
      .select("id")
      .eq("tracking_id", tid)
      .single();

    if (complaint) {
      await supabase.from("complaint_status_history").insert({
        complaint_id: complaint.id,
        status: "received" as const,
      });
    }

    setTrackingId(tid);
    setSubmitting(false);
  };

  const copyTrackingId = () => {
    if (trackingId) {
      navigator.clipboard.writeText(trackingId);
      toast.success("Tracking ID copied!");
    }
  };

  if (trackingId) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-lg">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
          <Card className="text-center">
            <div className="pt-8">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <h2 className="text-2xl font-bold font-display text-card-foreground">Complaint Submitted</h2>
              <p className="text-sm text-muted-foreground mt-1">Your complaint has been received and is being reviewed.</p>
            </div>
            <CardContent className="space-y-6 pt-6">
              <div className="rounded-lg border-2 border-dashed border-accent/40 bg-accent/5 p-6">
                <p className="text-sm text-muted-foreground mb-2">Your Tracking ID</p>
                <p className="text-2xl font-bold font-mono text-foreground tracking-wider">{trackingId}</p>
              </div>
              <Button variant="outline" onClick={copyTrackingId} className="gap-2">
                <Copy className="h-4 w-4" /> Copy Tracking ID
              </Button>
              <p className="text-sm text-muted-foreground">
                Save this ID to check the status of your complaint later.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10">
            <Shield className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-2xl font-bold font-display text-foreground">Submit a Complaint</h1>
            <p className="text-sm text-muted-foreground">Your identity will not be collected or stored.</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ComplaintCategory)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLAINT_CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">Complaint Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief summary of your complaint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the issue in detail. Include dates, locations, and any relevant information."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  maxLength={5000}
                />
                <p className="text-xs text-muted-foreground text-right">{description.length}/5000</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="files">Attachments (optional)</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-accent/40 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    id="files"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click or drag files here (images, PDFs — max 5 files)
                  </p>
                </div>
                {files.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {files.map((f) => (
                      <span key={f.name} className="text-xs bg-muted px-2 py-1 rounded">{f.name}</span>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                <strong className="text-foreground">Privacy Notice:</strong> No personal identifiers (IP address, device info, or account data) are collected or stored with your complaint.
              </div>

              <Button type="submit" variant="hero" size="lg" className="w-full" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Complaint Anonymously"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SubmitComplaint;
