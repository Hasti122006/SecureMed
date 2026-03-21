import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SecurityFeature from "@/components/SecurityFeature";
import { motion } from "framer-motion";
import {
  Shield, Lock, FileCheck, KeyRound, UserCheck, Eye,
  ArrowRight, CheckCircle2
} from "lucide-react";

const features = [
  { icon: Lock, title: "AES-256 Encryption", description: "Military-grade encryption protects every medical file stored in the system." },
  { icon: KeyRound, title: "ECC Key Exchange", description: "Elliptic Curve Cryptography secures the exchange of encryption keys." },
  { icon: FileCheck, title: "SHA-256 Integrity", description: "Cryptographic hashing detects any unauthorized tampering of records." },
  { icon: Shield, title: "ECDSA Signatures", description: "Digital signatures ensure prescriptions cannot be forged or denied." },
  { icon: UserCheck, title: "Role-Based Access", description: "Doctors, patients, and admins each have precisely scoped permissions." },
  { icon: Eye, title: "Non-Repudiation", description: "Signed prescriptions provide undeniable proof of authorship." },
];

const workflow = [
  "Secure registration with hashed passwords",
  "Multi-factor authentication verification",
  "Role-based authorization after login",
  "AES-256 encryption on file upload",
  "SHA-256 hash for integrity verification",
  "ECDSA digital signature for prescriptions",
  "Verified decryption on patient download",
];

const Home = () => (
  <div className="min-h-screen">
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-hidden bg-gradient-hero pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-medical-sky/10 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-medical-teal/10 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
      </div>
      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/5 px-4 py-1.5 mb-6">
            <Shield className="w-4 h-4 text-medical-teal" />
            <span className="text-sm font-medium text-primary-foreground/80">Enterprise-Grade Medical Security</span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold text-primary-foreground leading-tight mb-6">
            Secure Digital
            <br />
            <span className="text-medical-sky">Health System</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/70 mb-8 max-w-2xl mx-auto">
            Protect medical records with AES-256 encryption, ECDSA digital signatures, and SHA-256 integrity verification — all in one platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="hero" size="lg" asChild>
              <Link to="/login">
                Get Started <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button variant="hero-outline" size="lg" asChild>
              <Link to="/about">Learn More</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>

    {/* Security Features */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Cryptographic Security Stack
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Every layer of MedGuard is built on proven cryptographic primitives.
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <SecurityFeature key={f.title} {...f} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>

    {/* Workflow */}
    <section className="py-20 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              End-to-End Secure Workflow
            </h2>
            <p className="text-muted-foreground mb-8">
              From registration to record retrieval, every step is cryptographically secured.
            </p>
            <div className="space-y-4">
              {workflow.map((step, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-medical-teal mt-0.5 shrink-0" />
                  <span className="text-foreground">{step}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 shadow-elevated">
              <div className="space-y-4">
                {["Patient Registration", "Identity Verification", "Access Authorization", "File Encryption", "Signature Verification", "Secure Delivery"].map((label, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-foreground/10 flex items-center justify-center text-sm font-bold text-primary-foreground">
                      {i + 1}
                    </div>
                    <span className="text-primary-foreground/80 text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
            Ready to Secure Your Medical Records?
          </h2>
          <p className="text-muted-foreground mb-8">
            Join MedGuard and experience the highest standard of digital health security.
          </p>
          <Button size="lg" asChild>
            <Link to="/login">Create Your Account <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </motion.div>
      </div>
    </section>

    <Footer />
  </div>
);

export default Home;
