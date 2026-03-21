import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SecurityFeature from "@/components/SecurityFeature";
import { motion } from "framer-motion";
import { Lock, KeyRound, FileCheck, Shield, Eye, Server } from "lucide-react";

const principles = [
  { icon: Lock, title: "Confidentiality", description: "Patient data remains private through AES-256 encryption. Only authorized users can decrypt and access records." },
  { icon: FileCheck, title: "Integrity", description: "SHA-256 hashing ensures that medical records have not been altered or tampered with at any point." },
  { icon: KeyRound, title: "Authentication", description: "Secure login with hashed passwords verifies the identity of every doctor and patient." },
  { icon: Shield, title: "Authorization", description: "Role-based access control ensures doctors upload reports while patients can only view their own records." },
  { icon: Eye, title: "Non-Repudiation", description: "ECDSA digital signatures ensure doctors cannot deny issuing prescriptions." },
  { icon: Server, title: "Secure Key Exchange", description: "Elliptic Curve Cryptography protects AES keys during transfer between parties." },
];

const About = () => (
  <div className="min-h-screen">
    <Navbar />
    <section className="pt-28 pb-16 bg-gradient-hero">
      <div className="container mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-primary-foreground mb-4">About MedGuard</h1>
          <p className="text-lg text-primary-foreground/70 max-w-2xl mx-auto">
            MedGuard is a secure digital health system designed to protect medical records using modern cryptographic techniques.
          </p>
        </motion.div>
      </div>
    </section>

    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">Core Security Principles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {principles.map((p, i) => (
            <SecurityFeature key={p.title} {...p} delay={i * 0.1} />
          ))}
        </div>
      </div>
    </section>

    <section className="py-20 bg-card border-y border-border">
      <div className="container mx-auto px-4 max-w-3xl">
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-8">How It Works</h2>
        <div className="space-y-6">
          {[
            "Users register and passwords are stored as secure hashed values.",
            "During login, the authentication module verifies user credentials.",
            "After login, the authorization module grants role-based access.",
            "Doctors upload medical files which are encrypted with AES-256.",
            "The AES key is protected using ECC encryption for secure key exchange.",
            "A SHA-256 hash is generated for each file to detect tampering.",
            "Prescriptions are digitally signed using ECDSA.",
            "Patients download files after hash and signature verification, then decrypt securely.",
          ].map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex gap-4 items-start"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-medical flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
                {i + 1}
              </div>
              <p className="text-foreground pt-1">{step}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default About;
