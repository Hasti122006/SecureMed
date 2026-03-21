import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-card">
    <div className="container mx-auto px-4 py-12">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center gap-2 font-display font-bold text-lg text-foreground mb-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-medical flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary-foreground" />
            </div>
            MedGuard
          </Link>
          <p className="text-sm text-muted-foreground">Secure Digital Health System protecting medical records with modern cryptography.</p>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-foreground">Platform</h4>
          <div className="flex flex-col gap-2">
            <Link to="/about" className="text-sm text-muted-foreground hover:text-primary">About</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-primary">Contact</Link>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-foreground">Security</h4>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">AES-256 Encryption</span>
            <span className="text-sm text-muted-foreground">ECDSA Signatures</span>
            <span className="text-sm text-muted-foreground">SHA-256 Integrity</span>
          </div>
        </div>
        <div>
          <h4 className="font-display font-semibold mb-3 text-foreground">Legal</h4>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Privacy Policy</span>
            <span className="text-sm text-muted-foreground">Terms of Service</span>
            <span className="text-sm text-muted-foreground">HIPAA Compliance</span>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} MedGuard. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;
