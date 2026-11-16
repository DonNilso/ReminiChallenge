import SetDetail from "@/components/SetDetail.tsx";

export default async function SetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SetDetail id={id} />;
}
