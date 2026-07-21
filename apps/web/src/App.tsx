import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { BareLayout } from "./components/BareLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { AdminRequire } from "./components/admin/AdminRequire";
import { DocumentPage } from "./pages/DocumentPage";
import { WorkDetailPage } from "./pages/WorkDetail";
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
import { AdminSitePage } from "./pages/admin/SiteAdmin";
import { AdminNavPage } from "./pages/admin/NavAdmin";
import {
  AdminPageEditorPage,
  AdminPagesListPage,
} from "./pages/admin/PagesAdmin";
import { AdminSectorsPage } from "./pages/admin/SectorsAdmin";
import { StudioApp } from "./studio/StudioApp";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<BareLayout />}>
          <Route index element={<DocumentPage titleFallback="Home" />} />
          <Route
            path="automotive"
            element={<DocumentPage slugOverride="automotive" titleFallback="Automotive" />}
          />
          <Route
            path="charity"
            element={<DocumentPage slugOverride="charity" titleFallback="Charity" />}
          />
          <Route
            path="education"
            element={<DocumentPage slugOverride="education" titleFallback="Education" />}
          />
          <Route path="about" element={<DocumentPage slugOverride="about" titleFallback="About" />} />
          <Route
            path="contact"
            element={<DocumentPage slugOverride="contact" titleFallback="Contact" />}
          />
          <Route path="p/*" element={<DocumentPage />} />
        </Route>

        <Route element={<Layout />}>
          <Route path="work/:slug" element={<WorkDetailPage />} />
        </Route>

        <Route path="admin/login" element={<AdminLoginPage />} />

        <Route
          path="admin/studio"
          element={
            <AdminRequire>
              <StudioApp />
            </AdminRequire>
          }
        />

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
          <Route path="site" element={<AdminSitePage />} />
          <Route path="navigation" element={<AdminNavPage />} />
          <Route path="pages" element={<AdminPagesListPage />} />
          <Route path="pages/:key" element={<AdminPageEditorPage />} />
          <Route path="sectors" element={<AdminSectorsPage />} />
          <Route path="case-studies" element={<AdminCaseStudiesListPage />} />
          <Route path="case-studies/new" element={<AdminCaseStudyNewPage />} />
          <Route path="case-studies/:id" element={<AdminCaseStudyEditPage />} />
          <Route path="testimonials" element={<AdminTestimonialsPage />} />
          <Route path="skills" element={<AdminSkillsPage />} />
          <Route path="timeline" element={<AdminTimelinePage />} />
          <Route path="settings" element={<Navigate to="/admin/site" replace />} />
        </Route>

        <Route path="*" element={<DocumentPage />} />
      </Routes>
    </BrowserRouter>
  );
}
