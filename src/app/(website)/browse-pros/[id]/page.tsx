import { ProPublicProfile } from "@/components/web-pages/pro-public-profile";

export default async function ProPublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProPublicProfile id={id} />;
}
