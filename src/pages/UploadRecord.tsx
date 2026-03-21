import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, Upload, FileText, PenTool, Users, CloudUpload, Lock, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { generateAESKey, encryptFileAES, exportAESKey, hashFileSHA256 } from "@/lib/crypto";
import { toast } from "sonner";

const navItems = [
  { label: "Dashboard", to: "/doctor", icon: LayoutDashboard },
  { label: "Upload Record", to: "/doctor/upload", icon: Upload },
  { label: "Prescriptions", to: "/doctor/prescriptions", icon: PenTool },
  { label: "Patients", to: "/doctor/patients", icon: Users },
];

const UploadRecord = () => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState("");
  const [recordType, setRecordType] = useState("Lab Report");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cryptoLog, setCryptoLog] = useState<string[]>([]);
  const [patients, setPatients] = useState<any[]>([]);

  // Fetch patients on load
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        // Try fetching patients
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
    
    fetchPatients();
  }, []);

  const handleUpload = async () => {
    if (!file || !patientId || !user) {
      toast.error("Please fill in all fields and select a file");
      return;
    }

    setUploading(true);
    setCryptoLog([]);
    const log = (msg: string) => setCryptoLog((prev) => [...prev, msg]);

    try {
      // Step 1: Read file
      const fileBuffer = await file.arrayBuffer();
      log("✓ File loaded into memory");

      // Step 2: Generate SHA-256 hash
      const sha256Hash = await hashFileSHA256(fileBuffer);
      log(`✓ SHA-256 hash generated: ${sha256Hash.substring(0, 20)}...`);

      // Step 3: Generate AES-256 key
      const aesKey = await generateAESKey();
      log("✓ AES-256 encryption key generated");

      // Step 4: Encrypt file with AES-256-GCM
      const { encrypted, iv } = await encryptFileAES(fileBuffer, aesKey);
      log(`✓ File encrypted with AES-256-GCM (IV: ${iv.substring(0, 12)}...)`);

      // Step 5: Export AES key
      const exportedKey = await exportAESKey(aesKey);
      log("✓ AES key exported for secure storage");

      // Step 6: Upload encrypted file to storage
      const filePath = `${patientId}/${Date.now()}_${file.name}.enc`;
      const encryptedBlob = new Blob([encrypted]);
      const { error: storageError } = await supabase.storage
        .from("medical-records")
        .upload(filePath, encryptedBlob);

      if (storageError) throw storageError;
      log("✓ Encrypted file uploaded to secure storage");

      // Step 7: Store metadata in database
      const { error: dbError } = await supabase.from("medical_records").insert({
        doctor_id: user.id,
        patient_id: patientId,
        record_type: recordType,
        description,
        file_name: file.name,
        file_path: filePath,
        encrypted_aes_key: exportedKey,
        iv,
        sha256_hash: sha256Hash,
      });

      if (dbError) throw dbError;
      log("✓ Record metadata saved to database");

      // Step 8: Audit log
      await supabase.from("audit_logs").insert({
        user_id: user.id,
        action: "upload_record",
        details: `Uploaded ${file.name} for patient ${patientId}`,
      });
      log("✓ Audit log entry created");

      toast.success("Medical record encrypted and uploaded successfully!");
      setFile(null);
      setDescription("");
    } catch (err: any) {
      log(`✗ Error: ${err.message}`);
      toast.error(err.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <DashboardLayout title="Upload Medical Record" subtitle="Encrypt and upload patient records securely" navItems={navItems}>
      <div className="max-w-2xl">
        <div className="bg-card border border-border rounded-xl p-6 shadow-card mb-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Record Details</h3>
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
              <Label>Record Type</Label>
              <select className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm" value={recordType} onChange={(e) => setRecordType(e.target.value)}>
                <option>Lab Report</option>
                <option>X-Ray / Imaging</option>
                <option>Prescription</option>
                <option>Discharge Summary</option>
                <option>Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Brief description of the record" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-card mb-6">
          <h3 className="font-display font-semibold text-foreground mb-4">Upload File</h3>
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-10 cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
            <CloudUpload className="w-10 h-10 text-muted-foreground mb-3" />
            <span className="text-sm font-medium text-foreground mb-1">
              {file?.name || "Click to upload or drag and drop"}
            </span>
            <span className="text-xs text-muted-foreground">PDF, JPG, PNG up to 20MB</span>
            <input type="file" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 mb-6">
          <h4 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" /> Security Processing
          </h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-medical-teal" />AES-256-GCM encryption will be applied to the file</div>
            <div className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-medical-teal" />SHA-256 hash will be generated for integrity verification</div>
            <div className="flex items-center gap-2"><FileCheck className="w-4 h-4 text-medical-teal" />Encrypted key stored securely in database</div>
          </div>
        </div>

        {cryptoLog.length > 0 && (
          <div className="bg-card border border-border rounded-xl p-5 mb-6 font-mono text-xs space-y-1">
            <h4 className="font-display font-semibold text-foreground mb-2 text-sm">Cryptographic Operations Log</h4>
            {cryptoLog.map((line, i) => (
              <p key={i} className={line.startsWith("✗") ? "text-destructive" : "text-medical-teal"}>{line}</p>
            ))}
          </div>
        )}

        <Button size="lg" className="w-full" onClick={handleUpload} disabled={uploading}>
          <Upload className="w-4 h-4 mr-2" /> {uploading ? "Encrypting & Uploading..." : "Encrypt & Upload Record"}
        </Button>
      </div>
    </DashboardLayout>
  );
};

export default UploadRecord;
