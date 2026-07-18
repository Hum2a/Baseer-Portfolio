import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../../lib/auth-client";

export function AdminRequire({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession();
  const location = useLocation();

  if (isPending) {
    return (
      <div className="min-h-screen bg-fog flex items-center justify-center page-pad">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-graphite/50">
          Checking session…
        </p>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
    );
  }

  return <>{children}</>;
}
