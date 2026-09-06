import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Sidebar from "./components/Sidebar";
import LoginPage from "./pages/LoginPage";
import OnboardingSelfReportPage from "./pages/OnboardingSelfReportPage";
import OnboardingPlacementTestPage from "./pages/OnboardingPlacementTestPage";
import HomePage from "./pages/HomePage";
import StoryEntryPage from "./pages/StoryEntryPage";
import StoryReaderPage from "./pages/StoryReaderPage";
import HardWordsPage from "./pages/HardWordsPage";
import ProgressPage from "./pages/ProgressPage";
import StoryHistoryPage from "./pages/StoryHistoryPage";
import styles from "./App.module.css";

function AppShell({ children }) {
  return (
    <div className={styles.shell}>
      <Sidebar />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/onboarding/level"
          element={
            <ProtectedRoute requireOnboarding={false}>
              <OnboardingSelfReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/onboarding/placement"
          element={
            <ProtectedRoute requireOnboarding={false}>
              <OnboardingPlacementTestPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppShell>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/story" element={<StoryEntryPage />} />
                  <Route path="/story/:id" element={<StoryReaderPage />} />
                  <Route path="/words" element={<HardWordsPage />} />
                  <Route path="/progress" element={<ProgressPage />} />
                  <Route path="/history" element={<StoryHistoryPage />} />
                </Routes>
              </AppShell>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}
