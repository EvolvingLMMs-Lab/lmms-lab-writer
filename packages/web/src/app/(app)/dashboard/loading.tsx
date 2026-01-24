export default function DashboardLoading() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-lg font-bold tracking-tight uppercase flex items-center gap-3">
            <div className="logo-bar text-foreground">
              <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
            </div>
            LMMs-Lab Writer
          </div>
          <div className="flex items-center gap-4">
            <div className="h-9 w-32 bg-border animate-pulse" />
            <div className="h-9 w-20 bg-border animate-pulse" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-light tracking-tight">Documents</h1>
          <div className="flex items-center gap-3">
            <div className="size-8 bg-border animate-pulse" />
            <div className="space-y-1">
              <div className="h-4 w-32 bg-border animate-pulse" />
              <div className="h-3 w-24 bg-border animate-pulse" />
            </div>
          </div>
        </div>

        <div className="border border-border divide-y divide-border">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="size-10 border border-border bg-border animate-pulse" />
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-border animate-pulse" />
                  <div className="h-3 w-24 bg-border animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
