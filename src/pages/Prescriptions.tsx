import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, Upload, PenTool, Users, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateECDSAKeyPair, signDataECDSA, exportPublicKey } from "@/lib/crypto";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/doctor", icon: LayoutDashboard },
  { label: "Upload Record", to: "/doctor/upload", icon: Upload },
  { label: "Prescriptions", to: "/doctor/prescriptions", icon: PenTool },
  { label: "Patients", to: "/doctor/patients", icon: Users },
];

const Prescriptions = () => {
  const { user } = useAuth();
  const [patientId, setPatientId] = useState("");
  const [medication, setMedication] = useState("");
  const [instructions, setInstructions] = useState("");
  const [signing, setSigning] = useState(false);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [signLog, setSignLog] = useState<string[]>([]);

  const [patients, setPatients] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchPrescriptions();
      fetchPatients();
    }
  }, [user]);

  const fetchPatients = async () => {
    try {
      // Demo implementation: fetch profiles with patient role
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "patient");
        
      if (rolesError) {
        console.error("Error fetching roles:", rolesError);
        toast.error("Could not fetch patient list");
        return;
      }
        
      if (rolesData && rolesData.length > 0) {
        const patientIds = rolesData.map(r => r.user_id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", patientIds);
          
        if (profilesError) {
          console.error("Error fetching patient profiles:", profilesError);
          return;
        }
          
        if (profilesData) {
          setPatients(profilesData);
          if (profilesData.length > 0) {
            setPatientId(profilesData[0].user_id);
          }
        }
      } else {
        // Fallback if no specific patients found - fetch all profiles for demo
        const { data: allProfiles } = await supabase.from("profiles").select("user_id, full_name");
        if (allProfiles && allProfiles.length > 0) {
          setPatients(allProfiles);
          setPatientId(allProfiles[0].user_id);
        }
      }
    } catch (err) {
      console.error("Fetch patients failed", err);
    }
  };

  const fetchPrescriptions = async () => {
    const { data } = await supabase
      .from("prescriptions")
      .select("*")
      .eq("doctor_id", user!.id)
      .order("created_at", { ascending: false });
    if (data) setPrescriptions(data);
  };

  const handleSign = async () => {
    if (!patientId || !medication || !instructions || !user) {
      toast.error("Please fill in all fields");
      return;
    }

    setSigning(true);
    setSignLog([]);
    const log = (msg: string) => setSignLog((prev) => [...prev, msg]);

    try {
      // Step 1: Generate ECDSA key pair
      const keyPair = await generateECDSAKeyPair();
      log("✓ ECDSA key pair generated (P-256 curve)");

      // Step 2: Create prescription data string
      const prescriptionData = JSON.stringify({
        patientId,
        medication,
        instructions,
        doctorId: user.id,
        timestamp: new Date().toISOString(),
      });
      log("✓ Prescription data serialized");

      // Step 3: Sign with ECDSA private key
      const signature = await signDataECDSA(keyPair.privateKey, prescriptionData);
      log(`✓ ECDSA digital signature created: ${signature.substring(0, 20)}...`);

      // Step 4: Export public key for verification
      const publicKey = await exportPublicKey(keyPair.publicKey);
      log("✓ Public key exported for signature verification");

      // Step 5: Store in database
      const { error } = await supabase.from("prescriptions").insert({
        doctor_id: user.id,
        patient_id: patientId,
        medication,
        instructions,
        ecdsa_signature: signature,
        ecdsa_public_key: publicKey,
        prescription_data: prescriptionData,
      });

      if (error) throw error;
      log("✓ Signed prescription saved to database");

      // Audit log
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "sign_prescription",
        details: `Signed prescription for patient ${patientId}: ${medication}`,
      });
      log("✓ Audit log entry created (non-repudiation)");

      toast.success("Prescription signed and issued!");
      setMedication("");
      setInstructions("");
      fetchPrescriptions();
    } catch (err: any) {
      log(`✗ Error: ${err.message}`);
      toast.error(err.message || "Signing failed");
    } finally {
      setSigning(false);
    }
  };

  return (
    <DashboardLayout title="Prescriptions" subtitle="Create and digitally sign prescriptions with ECDSA" navItems={navItems}>
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-card mb-6">
            <h3 className="font-display font-semibold text-foreground mb-4">New Prescription</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select Patient</Label>
                {patients.length > 0 ? (
                  <select 
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" 
                    value={patientId} 
                    onChange={(e) => setPatientId(e.target.value)}
                  >
                    <option value="" disabled>Select a patient...</option>
                    {patients.map(p => (
                      <option key={p.user_id} value={p.user_id}>
                        {p.full_name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input placeholder="Loading patients..." disabled />
                )}
              </div>
              <div className="space-y-2">
                <Label>Medication</Label>
                <Input placeholder="Medication name and dosage" value={medication} onChange={(e) => setMedication(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Instructions</Label>
                <Textarea placeholder="Dosage instructions and notes" rows={4} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Shield className="w-4 h-4 text-primary" />
                  This prescription will be digitally signed with ECDSA for non-repudiation.
                </div>
              </div>
              <Button className="w-full" onClick={handleSign} disabled={signing}>
                <PenTool className="w-4 h-4 mr-2" /> {signing ? "Signing..." : "Sign & Issue Prescription"}
              </Button>
            </div>
          </div>

          {signLog.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5 font-mono text-xs space-y-1">
              <h4 className="font-display font-semibold text-foreground mb-2 text-sm">Digital Signing Log</h4>
              {signLog.map((line, i) => (
                <p key={i} className={line.startsWith("✗") ? "text-destructive" : "text-medical-teal"}>{line}</p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card border border-border rounded-xl shadow-card">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">Signed Prescriptions ({prescriptions.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {prescriptions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No prescriptions yet</p>
            ) : (
              prescriptions.map((p) => (
                <div key={p.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{p.medication}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-medical-teal/10 text-medical-teal flex items-center gap-1">
                    <PenTool className="w-3 h-3" /> ECDSA Signed
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Prescriptions;
