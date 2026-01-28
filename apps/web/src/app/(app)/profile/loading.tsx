export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-background sticky top-0 z-50 px-4 sm:px-6">
        <div className="w-full max-w-5xl mx-auto py-3 sm:py-4 flex items-center justify-between">
          <div className="h-6 w-32 bg-neutral-100 animate-pulse" />
          <div className="h-8 w-24 bg-neutral-100 animate-pulse" />
        </div>
      </header>
      <main className="flex-1 py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="h-8 w-48 bg-neutral-100 animate-pulse mb-8" />
          <div className="space-y-6">
            <div className="border border-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="size-16 bg-neutral-100 animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-neutral-100 animate-pulse" />
                  <div className="h-4 w-48 bg-neutral-50 animate-pulse" />
                </div>
              </div>
            </div>
            <div className="border border-border p-6">
              <div className="h-5 w-24 bg-neutral-100 animate-pulse mb-4" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-12 w-full bg-neutral-50 animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
