import DashboardLayout from "@/components/DashboardLayout";
import { LayoutDashboard, Users, Activity, Settings, Shield, UserCheck, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Activity Log", to: "/admin/activity", icon: Activity },
  { label: "Settings", to: "/admin/settings", icon: Settings },
];

const AdminPanel = () => {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [recordCount, setRecordCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [{ data: p }, { data: r }, { data: a }, { count }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("user_roles").select("*"),
      supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(10),
      supabase.from("medical_records").select("*", { count: "exact", head: true }),
    ]);
    setProfiles(p || []);
    setRoles(r || []);
    setAuditLogs(a || []);
    setRecordCount(count || 0);
  };

  const getUserRole = (userId: string) => {
    const r = roles.find((r) => r.user_id === userId);
    return r?.role || "unknown";
  };

  const doctorCount = roles.filter((r) => r.role === "doctor").length;
  const stats = [
    { label: "Total Users", value: String(profiles.length), icon: Users },
    { label: "Doctors", value: String(doctorCount), icon: UserCheck },
    { label: "Records Stored", value: String(recordCount), icon: FileText },
    { label: "Audit Events", value: String(auditLogs.length), icon: Shield },
  ];

  return (
    <DashboardLayout title="Admin Panel" subtitle="Manage users and monitor system activity" navItems={navItems}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl shadow-card">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">Users ({profiles.length})</h3>
          </div>
          <div className="divide-y divide-border">
            {profiles.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No users yet</p>
            ) : (
              profiles.map((u) => (
                <div key={u.id} className="px-5 py-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-foreground">{u.full_name}</p>
                    <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                    {getUserRole(u.user_id)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl shadow-card">
          <div className="p-5 border-b border-border">
            <h3 className="font-display font-semibold text-foreground">Recent Activity</h3>
          </div>
          <div className="divide-y divide-border">
            {auditLogs.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">No activity yet</p>
            ) : (
              auditLogs.map((a) => (
                <div key={a.id} className="px-5 py-4">
                  <p className="font-medium text-sm text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.details} · {new Date(a.created_at).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminPanel;
