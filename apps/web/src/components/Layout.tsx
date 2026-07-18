import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";
import { PageTransition } from "./motion";
import { trackPageView } from "../lib/analytics";

export function Layout() {
  const location = useLocation();

  useEffect(() => {
    const match = location.pathname.match(/^\/work\/([^/]+)/);
    trackPageView(location.pathname + location.search, match?.[1] ?? null);
  }, [location.pathname, location.search]);

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1">
        <PageTransition routeKey={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
      <SiteFooter />
    </div>
  );
}
