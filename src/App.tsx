import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PatientDashboard from "./pages/PatientDashboard";
import DoctorDashboard from "./pages/DoctorDashboard";
import UploadRecord from "./pages/UploadRecord";
import ViewRecords from "./pages/ViewRecords";
import Prescriptions from "./pages/Prescriptions";
import AdminPanel from "./pages/AdminPanel";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
const queryClient = new QueryClient();
const AuthRedirect = () => {
  const { user, role, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        {" "}
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />{" "}
      </div>
    );
  }
  if (!user) return <Login />;
  const redirectMap = {
    doctor: "/doctor",
    patient: "/patient",
    admin: "/admin",
  };
  const target = redirectMap[role ?? "patient"] ?? "/patient";
  return <Navigate to={target} replace />;
};
const App = () => (
  <AuthErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {" "}
      <TooltipProvider>
        {" "}
        <Toaster /> <Sonner />{" "}
        <BrowserRouter>
          {" "}
          <AuthProvider>
            {" "}
            <Routes>
              {" "}
              <Route path="/" element={<Home />} />{" "}
              <Route path="/login" element={<AuthRedirect />} />{" "}
              <Route
                path="/patient"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <PatientDashboard />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/patient/records"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <ViewRecords />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/patient/downloads"
                element={
                  <ProtectedRoute allowedRoles={["patient"]}>
                    <ViewRecords />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/doctor"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/doctor/upload"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <UploadRecord />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/doctor/prescriptions"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <Prescriptions />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/doctor/patients"
                element={
                  <ProtectedRoute allowedRoles={["doctor"]}>
                    <DoctorDashboard />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/admin/activity"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />{" "}
              <Route
                path="/admin/settings"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminPanel />
                  </ProtectedRoute>
                }
              />{" "}
              <Route path="/about" element={<About />} />{" "}
              <Route path="/contact" element={<Contact />} />{" "}
              <Route path="*" element={<NotFound />} />{" "}
            </Routes>{" "}
          </AuthProvider>{" "}
        </BrowserRouter>{" "}
      </TooltipProvider>{" "}
    </QueryClientProvider>
  </AuthErrorBoundary>
);
export default App;
