import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { COMPLAINT_CATEGORIES, STATUS_CONFIG } from "@/lib/complaints";
import type { ComplaintStatus } from "@/lib/complaints";
import { Shield, FileText, Search, Lock, Eye, BarChart3, UserCog, LogIn, MessageSquare, AlertTriangle, Send } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const features = [
  { icon: Shield, title: "100% Anonymous", description: "No login, no tracking. Your identity is never collected or stored." },
  { icon: Lock, title: "Encrypted & Secure", description: "All complaints are securely stored with encryption at rest." },
  { icon: FileText, title: "Easy Submission", description: "Simple form with categories, descriptions, and optional file uploads." },
  { icon: Search, title: "Track Status", description: "Use your unique tracking ID to check complaint status anytime." },
  { icon: Eye, title: "Transparent Process", description: "Follow your complaint through Received, In Review, to Resolved." },
  { icon: BarChart3, title: "Drives Change", description: "Aggregated reports help the university identify and fix systemic issues." },
];

interface ActiveComplaint {
  id: string;
  tracking_id: string;
  title: string;
  description: string;
  category: string;
  status: ComplaintStatus;
  created_at: string;
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
}

const CommentSection = ({ complaintId }: { complaintId: string }) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [posting, setPosting] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from("complaint_comments")
        .select("*")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false });
      setComments((data || []) as Comment[]);
    };
    fetchComments();
  }, [complaintId]);

  const handlePost = async () => {
    if (!newComment.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("complaint_comments").insert({
      complaint_id: complaintId,
      author_name: authorName.trim() || "Anonymous Student",
      content: newComment.trim(),
    });
    if (error) {
      toast.error("Failed to post comment");
    } else {
      toast.success("Comment posted!");
      setNewComment("");
      // Refresh
      const { data } = await supabase
        .from("complaint_comments")
        .select("*")
        .eq("complaint_id", complaintId)
        .order("created_at", { ascending: false });
      setComments((data || []) as Comment[]);
    }
    setPosting(false);
  };

  const visibleComments = showAll ? comments : comments.slice(0, 2);

  return (
    <div className="mt-3 space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Your name (optional)"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          className="w-32 text-xs h-8"
          maxLength={50}
        />
        <Input
          placeholder="Add a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 text-xs h-8"
          maxLength={1000}
          onKeyDown={(e) => e.key === "Enter" && handlePost()}
        />
        <Button size="sm" variant="outline" className="h-8 px-2" onClick={handlePost} disabled={posting || !newComment.trim()}>
          <Send className="h-3 w-3" />
        </Button>
      </div>
      {visibleComments.map((c) => (
        <div key={c.id} className="text-xs bg-muted/40 rounded-md px-3 py-2">
          <span className="font-medium text-foreground">{c.author_name}</span>
          <span className="text-muted-foreground ml-2">{new Date(c.created_at).toLocaleDateString()}</span>
          <p className="text-foreground/80 mt-0.5">{c.content}</p>
        </div>
      ))}
      {comments.length > 2 && (
        <button onClick={() => setShowAll(!showAll)} className="text-xs text-accent hover:underline">
          {showAll ? "Show less" : `View all ${comments.length} comments`}
        </button>
      )}
      {comments.length === 0 && <p className="text-xs text-muted-foreground">No comments yet. Be the first to speak up!</p>}
    </div>
  );
};

const Index = () => {
  const [activeComplaints, setActiveComplaints] = useState<ActiveComplaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(true);
  const [expandedComplaint, setExpandedComplaint] = useState<string | null>(null);

  useEffect(() => {
    const fetchActive = async () => {
      const { data } = await supabase
        .from("complaints")
        .select("*")
        .in("status", ["received", "in_review"])
        .order("created_at", { ascending: false })
        .limit(20);
      setActiveComplaints((data || []) as ActiveComplaint[]);
      setLoadingComplaints(false);
    };
    fetchActive();
  }, []);

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, hsl(45 70% 52% / 0.3), transparent 50%), radial-gradient(circle at 80% 20%, hsl(220 60% 40% / 0.4), transparent 50%)" }} />
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-6">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-accent">Safe & Confidential</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display text-primary-foreground mb-6 leading-tight">
              Your Voice Matters.{" "}
              <span className="text-gradient-gold">Anonymously.</span>
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 font-body leading-relaxed">
              Submit complaints about academic issues, harassment, infrastructure, or any concern — without revealing your identity. Together, we build a better Alard University.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/submit">
                <Button variant="hero" size="lg" className="text-base px-8">
                  Submit a Complaint
                </Button>
              </Link>
              <Link to="/track">
                <Button variant="heroOutline" size="lg" className="text-base px-8">
                  Track Your Complaint
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Terms & Conditions Warning */}
      <section className="bg-destructive/5 border-y border-destructive/20">
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-start gap-4 max-w-3xl mx-auto"
          >
            <AlertTriangle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">⚠️ Warning: Fake Complaints Policy</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Submitting false, misleading, or defamatory complaints is a serious violation of the university's code of conduct.
                While complaints are anonymous, the university reserves the right to investigate patterns of abuse.
                <strong className="text-foreground"> Consequences may include disciplinary action, suspension, or legal proceedings.</strong>
                {" "}By using this platform you agree to submit only truthful and genuine complaints. Misuse undermines the system for everyone.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Active Complaints Feed */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 mb-4">
            <MessageSquare className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium text-accent">Live Feed</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
            Active Complaints
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            See what's currently being addressed. Join the discussion by leaving comments.
          </p>
        </motion.div>

        {loadingComplaints ? (
          <p className="text-center text-muted-foreground py-8">Loading complaints...</p>
        ) : activeComplaints.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No active complaints right now. All clear! 🎉</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4 max-w-5xl mx-auto">
            {activeComplaints.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground text-sm truncate">{c.title}</p>
                        <p className="text-xs text-muted-foreground font-mono">{c.tracking_id}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge variant="outline" className="text-[10px]">
                          {COMPLAINT_CATEGORIES.find((cat) => cat.value === c.category)?.label}
                        </Badge>
                        <Badge className={`${STATUS_CONFIG[c.status].color} text-[10px]`}>
                          {STATUS_CONFIG[c.status].label}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{c.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                      <button
                        onClick={() => setExpandedComplaint(expandedComplaint === c.id ? null : c.id)}
                        className="text-xs text-accent hover:underline flex items-center gap-1"
                      >
                        <MessageSquare className="h-3 w-3" />
                        Comments
                      </button>
                    </div>
                    {expandedComplaint === c.id && <CommentSection complaintId={c.id} />}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Features */}
      <section className="bg-secondary/10 border-t border-border">
        <div className="container mx-auto px-4 py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              A safe, transparent, and efficient process to address your concerns.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-lg hover:border-accent/40 transition-all duration-300"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-accent/10 mb-4">
                  <f.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="font-display font-semibold text-lg text-card-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Authorities Portal */}
      <section className="border-t border-border">
        <div className="container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="max-w-xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 mb-4">
              <UserCog className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">For University Authorities</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-4">
              Authorities Portal
            </h2>
            <p className="text-muted-foreground mb-4">
              Authorized university officials can log in to view, manage, and resolve submitted complaints securely.
            </p>
            <Link to="/admin/login">
              <Button variant="default" size="lg" className="text-base px-8 gap-2">
                <LogIn className="h-5 w-5" /> Sign In as Authority
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-card border-t border-border">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-4">
            Ready to speak up?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Your complaint is anonymous and confidential. Help us improve Alard University.
          </p>
          <Link to="/submit">
            <Button variant="hero" size="lg" className="text-base px-10">
              Submit Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
