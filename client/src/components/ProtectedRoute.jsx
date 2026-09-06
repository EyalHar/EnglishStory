import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, requireOnboarding = true }) {
  const { token, user, loading } = useAuth();

  if (loading) return null;
  if (!token) return <Navigate to="/login" replace />;

  const completed = user?.onboarding?.completed;
  if (requireOnboarding && !completed) return <Navigate to="/onboarding/level" replace />;
  if (!requireOnboarding && completed) return <Navigate to="/" replace />;

  return children;
}
