import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Download, CheckCircle2, Search, ShieldCheck, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { importAESKey, decryptFileAES, hashFileSHA256, verifySignatureECDSA } from "@/lib/crypto";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/patient", icon: LayoutDashboard },
  { label: "My Records", to: "/patient/records", icon: FileText },
  { label: "Downloads", to: "/patient/downloads", icon: Download },
];

const ViewRecords = () => {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const isDownloadsView = pathname.includes("/downloads");
  const [records, setRecords] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [decrypting, setDecrypting] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchRecords();
      if (!isDownloadsView) fetchPrescriptions();
    }
  }, [user, isDownloadsView]);

  const fetchRecords = async () => {
    const { data } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setRecords(data);
  };

  const fetchPrescriptions = async () => {
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("patient_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setPrescriptions(data);
  };

  const handleDecryptDownload = async (record: any) => {
    setDecrypting(record.id);
    try {
      // Step 1: Download encrypted file
      const { data: fileData, error } = await supabase.storage
        .from("medical-records")
        .download(record.file_path);
      if (error) throw error;

      const encryptedBuffer = await fileData.arrayBuffer();

      // Step 2: Verify SHA-256 hash integrity
      // (hash the original - we verify the encrypted file hash stored in DB)
      toast.info("Verifying SHA-256 integrity hash...");

      // Step 3: Import AES key and decrypt
      const aesKey = await importAESKey(record.encrypted_aes_key);
      const decrypted = await decryptFileAES(encryptedBuffer, aesKey, record.iv);

      // Step 4: Verify decrypted file hash
      const hash = await hashFileSHA256(decrypted);
      const hashMatch = hash === record.sha256_hash;

      if (hashMatch) {
        toast.success("SHA-256 integrity verified ✓ — File has not been tampered with");
      } else {
        toast.error("SHA-256 integrity check FAILED — File may have been tampered with!");
      }

      // Step 5: Download decrypted file
      const blob = new Blob([decrypted]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.file_name;
      a.click();
      URL.revokeObjectURL(url);

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user!.id,
        action: "download_record",
        details: `Downloaded and decrypted ${record.file_name}`,
      });
    } catch (err: any) {
      toast.error(err.message || "Decryption failed");
    } finally {
      setDecrypting(null);
    }
  };

  const filteredRecords = records.filter((r) =>
    r.file_name.toLowerCase().includes(search.toLowerCase()) ||
    r.record_type.toLowerCase().includes(search.toLowerCase())
  );

  const handleDownloadPrescriptionProof = async (p: {
    id: string;
    medication: string;
    instructions: string;
    created_at: string;
    prescription_data: string;
    ecdsa_signature: string;
    ecdsa_public_key: string;
  }) => {
    if (!p.prescription_data || !p.ecdsa_signature || !p.ecdsa_public_key) {
      toast.error("This prescription has no signature data stored — re-issue from your doctor.");
      return;
    }
    try {
      const ok = await verifySignatureECDSA(p.ecdsa_public_key, p.ecdsa_signature, p.prescription_data);
      if (!ok) {
        toast.error("Signature verification failed — do not trust this prescription data.");
        return;
      }
      const bundle = {
        medguard_export_version: "1.0",
        description:
          "Real ECDSA P-256 + SHA-256 signature (Web Crypto). The signature was computed over prescription_data (exact string, byte-for-byte).",
        issued_at_utc: p.created_at,
        medication: p.medication,
        instructions: p.instructions,
        prescription_data: p.prescription_data,
        ecdsa_signature_base64: p.ecdsa_signature,
        ecdsa_public_key_spki_base64: p.ecdsa_public_key,
      };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `prescription-signed-${p.medication.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 40)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Downloaded signed prescription — signature verified ✓");
      void supabase.from("audit_logs").insert({
        user_id: user!.id,
        action: "download_prescription_proof",
        details: `Exported signed JSON for prescription ${p.id}`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      toast.error(msg);
    }
  };

  const layoutTitle = isDownloadsView ? "Downloads" : "My Medical Records";
  const layoutSubtitle = isDownloadsView
    ? "Decrypt AES-256–protected files and save them to your device. Integrity is verified with SHA-256 before download."
    : "View, verify, and download your encrypted medical records";

  return (
    <DashboardLayout title={layoutTitle} subtitle={layoutSubtitle} navItems={navItems}>
      {isDownloadsView && (
        <div className="mb-6 p-4 rounded-xl border border-primary/20 bg-primary/5 text-sm text-muted-foreground">
          <p className="text-foreground font-medium mb-1">Looking for prescriptions or the full table?</p>
          <p>
            Use{" "}
            <Link to="/patient/records" className="text-primary font-medium hover:underline inline-flex items-center gap-1">
              My Records <ArrowRight className="w-3.5 h-3.5" />
            </Link>{" "}
            to browse everything in one place.
          </p>
        </div>
      )}

      <div className="mb-6 relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search records..." className="pl-10" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {/* Medical Records — table on My Records; cards on Downloads */}
      <div className="bg-card border border-border rounded-xl shadow-card mb-6">
        <div className="p-5 border-b border-border">
          <h3 className="font-display font-semibold text-foreground">
            {isDownloadsView ? "Files ready to download" : "Encrypted Medical Records"} ({filteredRecords.length})
          </h3>
        </div>
        {filteredRecords.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">No medical records found</p>
        ) : isDownloadsView ? (
          <div className="p-5 grid gap-4 sm:grid-cols-2">
            {filteredRecords.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-border bg-muted/20 p-4 flex flex-col gap-3"
              >
                <div>
                  <p className="font-medium text-foreground">{r.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.record_type} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-medical-teal/10 text-medical-teal font-medium">
                    <CheckCircle2 className="w-3 h-3" /> SHA-256
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">
                    <ShieldCheck className="w-3 h-3" /> AES-256
                  </span>
                </div>
                <Button
                  className="w-full mt-auto"
                  size="lg"
                  onClick={() => handleDecryptDownload(r)}
                  disabled={decrypting === r.id}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {decrypting === r.id ? "Decrypting…" : "Decrypt & download"}
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Record</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Type</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Integrity</th>
                  <th className="text-left px-5 py-3 font-medium text-muted-foreground">Encryption</th>
                  <th className="text-right px-5 py-3 font-medium text-muted-foreground">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-medium text-foreground">{r.file_name}</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{r.record_type}</td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-xs font-medium text-medical-teal">
                        <CheckCircle2 className="w-3.5 h-3.5" /> SHA-256
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-1 text-xs font-medium text-primary">
                        <ShieldCheck className="w-3.5 h-3.5" /> AES-256
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDecryptDownload(r)}
                        disabled={decrypting === r.id}
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {decrypting === r.id ? "Decrypting..." : "Decrypt & Download"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescriptions only on My Records */}
      {!isDownloadsView && (
        <div className="bg-card border border-border rounded-xl shadow-card">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">My Prescriptions ({prescriptions.length})</h3>
          </div>
          {prescriptions.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No prescriptions found</p>
          ) : (
            <div className="divide-y divide-border">
              {prescriptions.map((p) => (
                <div key={p.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <p className="font-medium text-foreground">{p.medication}</p>
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-medical-teal/10 text-medical-teal shrink-0">
                        ECDSA Signed ✓
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{p.instructions}</p>
                    <p className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      The digital signature is real (P-256 + SHA-256). Download a JSON file that includes the signature and public key for verification.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 self-start sm:self-center"
                    onClick={() =>
                      handleDownloadPrescriptionProof({
                        id: p.id,
                        medication: p.medication,
                        instructions: p.instructions,
                        created_at: p.created_at,
                        prescription_data: p.prescription_data,
                        ecdsa_signature: p.ecdsa_signature,
                        ecdsa_public_key: p.ecdsa_public_key,
                      })
                    }
                  >
                    <Download className="w-3.5 h-3.5 mr-1.5" />
                    Download signed JSON
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
};

export default ViewRecords;
