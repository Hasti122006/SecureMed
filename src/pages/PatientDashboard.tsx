import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, FileText, Download, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

const navItems = [
  { label: "Dashboard", to: "/patient", icon: LayoutDashboard },
  { label: "My Records", to: "/patient/records", icon: FileText },
  { label: "Downloads", to: "/patient/downloads", icon: Download },
];

const PatientDashboard = () => {
  const { user } = useAuth();
  const [recordCount, setRecordCount] = useState(0);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const [{ count: rc }, { count: pc }, { data: recent }] = await Promise.all([
      supabase.from("medical_records").select("*", { count: "exact", head: true }).eq("patient_id", user!.id),
      supabase.from("prescriptions").select("*", { count: "exact", head: true }).eq("patient_id", user!.id),
      supabase.from("medical_records").select("*").eq("patient_id", user!.id).order("created_at", { ascending: false }).limit(5),
    ]);
    setRecordCount(rc || 0);
    setPrescriptionCount(pc || 0);
    setRecentRecords(recent || []);
  };

  const stats = [
    { label: "Medical Records", value: String(recordCount), icon: FileText },
    { label: "Verified Records", value: String(recordCount), icon: CheckCircle2 },
    { label: "Prescriptions", value: String(prescriptionCount), icon: Shield },
  ];

  return (
    <DashboardLayout title="Patient Dashboard" subtitle="View and manage your medical records securely" navItems={navItems}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
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

      <div className="bg-card border border-border rounded-xl shadow-card">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="font-display font-semibold text-foreground">Recent Records</h3>
          <Button variant="ghost" size="sm" asChild><Link to="/patient/records">View All</Link></Button>
        </div>
        <div className="divide-y divide-border">
          {recentRecords.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-muted-foreground">No records yet. Your doctor will upload records for you.</p>
          ) : (
            recentRecords.map((r) => (
              <div key={r.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm text-foreground">{r.file_name}</p>
                  <p className="text-xs text-muted-foreground">{r.record_type} · {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                  🔒 AES-256
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
