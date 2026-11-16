import TabBar from "@/components/host/TabBar.tsx";

/** Host-app tabs (mock). Creator Studio lives outside this group as a full-screen flow. */
export default function TabsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <TabBar />
    </>
  );
}
