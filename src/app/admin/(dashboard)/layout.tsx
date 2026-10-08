import { requireAdminPage } from "@/lib/session";
import { AdminChrome } from "@/components/admin/admin-chrome";

export const metadata = { title: { default: "Admin | ARAS", template: "%s | ARAS Admin" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdminPage("/admin");

  return (
    <AdminChrome user={{ name: user.name ?? null, email: user.email ?? "" }}>
      {children}
    </AdminChrome>
  );
}
