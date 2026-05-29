export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background min-h-[80vh]">
      <main className="w-full">
        {children}
      </main>
    </div>
  );
}
