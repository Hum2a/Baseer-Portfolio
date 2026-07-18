import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminRequire } from "./components/admin/AdminRequire";
import { HomePage } from "./pages/Home";
import { SectorPage } from "./pages/SectorPage";
import { WorkDetailPage } from "./pages/WorkDetail";
import { AboutPage } from "./pages/About";
import { ContactPage } from "./pages/Contact";
import { AdminLoginPage } from "./pages/admin/Login";
import { AdminDashboardPage } from "./pages/admin/Dashboard";
import { AdminAnalyticsPage } from "./pages/admin/AnalyticsAdmin";
import { AdminCaseStudiesListPage } from "./pages/admin/CaseStudiesList";
import {
  AdminCaseStudyEditPage,
  AdminCaseStudyNewPage,
} from "./pages/admin/CaseStudyEdit";
import { AdminTestimonialsPage } from "./pages/admin/TestimonialsAdmin";
import { AdminSkillsPage } from "./pages/admin/SkillsAdmin";
import { AdminTimelinePage } from "./pages/admin/TimelineAdmin";
import { AdminSettingsPage } from "./pages/admin/SettingsAdmin";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="automotive" element={<SectorPage sector="automotive" />} />
          <Route path="charity" element={<SectorPage sector="charity" />} />
          <Route path="education" element={<SectorPage sector="education" />} />
          <Route path="work/:slug" element={<WorkDetailPage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="contact" element={<ContactPage />} />
        </Route>

        <Route path="admin/login" element={<AdminLoginPage />} />

        <Route
          path="admin"
          element={
            <AdminRequire>
              <AdminLayout />
            </AdminRequire>
          }
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="case-studies" element={<AdminCaseStudiesListPage />} />
          <Route path="case-studies/new" element={<AdminCaseStudyNewPage />} />
          <Route path="case-studies/:id" element={<AdminCaseStudyEditPage />} />
          <Route path="testimonials" element={<AdminTestimonialsPage />} />
          <Route path="skills" element={<AdminSkillsPage />} />
          <Route path="timeline" element={<AdminTimelinePage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
