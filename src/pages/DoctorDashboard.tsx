import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, Upload, FileText, PenTool, Users, User } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Dashboard", to: "/doctor", icon: LayoutDashboard },
  { label: "Upload Record", to: "/doctor/upload", icon: Upload },
  { label: "Prescriptions", to: "/doctor/prescriptions", icon: PenTool },
  { label: "Patients", to: "/doctor/patients", icon: Users },
];

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [recordCount, setRecordCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [recentUploads, setRecentUploads] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [{ count: rc }, { count: pc }, { data: recent }] = await Promise.all([
      supabase.from("medical_records").select("*", { count: "exact", head: true }).eq("doctor_id", user!.id),
      supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("doctor_id", user!.id),
      supabase.from("medical_records").select("*").eq("doctor_id", user!.id).order("created_at", { ascending: false }).limit(10),
    ]);
    setRecordCount(rc || 0);
    setPrescriptionCount(pc || 0);
    const rows = recent || [];
    const patientIds = [...new Set(rows.map((r) => r.patient_id))];
    let nameById: Record<string, string> = {};
    if (patientIds.length > 0) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name").in("user_id", patientIds);
      nameById = Object.fromEntries((profs || []).map((p) => [p.user_id, p.full_name]));
    }
    setRecentUploads(
      rows.map((r) => ({
        ...r,
        patient_display_name: nameById[r.patient_id] || "Patient (name unavailable)",
      }))
    );
  };

  const stats = [
    { label: "Records Uploaded", value: String(recordCount), icon: FileText },
    { label: "Prescriptions Signed", value: String(prescriptionCount), icon: PenTool },
  ];

  return (
    <DashboardLayout title="Doctor Dashboard" subtitle="Upload records and manage prescriptions securely" navItems={navItems}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-card border border-border rounded-xl p-5 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
              </div>
              <p className="font-display text-2xl font-bold text-foreground">{s.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Link to="/doctor/upload" className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-gradient-medical flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Upload className="w-5 h-5 text-primary-foreground" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-1">Upload Medical Record</h3>
          <p className="text-sm text-muted-foreground">Encrypt and upload a patient's medical file</p>
        </Link>
        <Link to="/doctor/prescriptions" className="bg-card border border-border rounded-xl p-5 shadow-card hover:shadow-elevated transition-shadow group">
          <div className="w-10 h-10 rounded-lg bg-medical-teal flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <PenTool className="w-5 h-5 text-accent-foreground" />
          </div>
          <h3 className="font-display font-semibold text-foreground mb-1">Create Prescription</h3>
          <p className="text-sm text-muted-foreground">Write and digitally sign a prescription</p>
        </Link>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="p-5 border-b border-border">
          <h3 className="font-display font-semibold text-foreground">Recent uploads</h3>
          <p className="text-xs text-muted-foreground mt-1">Each row shows which patient received the file.</p>
        </div>
        <div className="divide-y divide-border">
          {recentUploads.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No uploads yet. Start by uploading a medical record.</p>
          ) : (
            recentUploads.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">{r.file_name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.record_type} · {new Date(r.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-primary font-medium mt-1.5 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">Patient: {r.patient_display_name}</span>
                  </p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary shrink-0">
                  Encrypted
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
