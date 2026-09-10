import { ambilDataPlatform, wajibSuperAdmin } from "@/lib/server/aksi-superadmin";
import { PanelSuperadmin } from "@/components/superadmin/panel-superadmin";

export const metadata = {
  title: "Super Admin Platform | KasToko",
};

export default async function HalamanSuperAdmin() {
  await wajibSuperAdmin();
  const data = await ambilDataPlatform();

  return (
    <div className="min-h-screen bg-muted/20">
      <PanelSuperadmin data={data} />
    </div>
  );
}
