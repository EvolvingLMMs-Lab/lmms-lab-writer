export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-border bg-background sticky top-0 z-50">
        <div className="w-full max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="h-6 w-40 bg-neutral-200 animate-pulse" />
          <div className="h-8 w-8 bg-neutral-200 animate-pulse" />
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <div className="h-9 w-48 bg-neutral-200 animate-pulse mb-2" />
          <div className="h-5 w-32 bg-neutral-100 animate-pulse" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-border p-6">
              <div className="h-24 bg-neutral-100 animate-pulse" />
            </div>
          ))}
        </div>

        <div className="border border-border">
          <div className="px-6 py-4 border-b border-border bg-neutral-50">
            <div className="h-4 w-32 bg-neutral-200 animate-pulse" />
          </div>
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="px-6 py-4">
                <div className="h-5 w-48 bg-neutral-200 animate-pulse mb-2" />
                <div className="h-4 w-64 bg-neutral-100 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
