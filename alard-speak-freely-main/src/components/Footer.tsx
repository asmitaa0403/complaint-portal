import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card mt-auto">
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-sm text-muted-foreground">
            Alard University Anonymous Complaint Portal
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          Your identity is never collected. All submissions are encrypted and anonymous.
        </p>
      </div>
    </div>
  </footer>
);

export default Footer;
