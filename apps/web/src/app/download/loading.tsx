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
        <div className="max-w-5xl mx-auto">
          <div className="h-8 w-32 bg-neutral-100 animate-pulse mb-2" />
          <div className="h-4 w-24 bg-neutral-50 animate-pulse mb-10" />
          <div className="space-y-8 max-w-2xl">
            {[1, 2, 3].map((i) => (
              <div key={i}>
                <div className="h-4 w-20 bg-neutral-100 animate-pulse mb-3" />
                <div className="flex gap-3">
                  <div className="h-10 w-32 bg-neutral-50 animate-pulse border border-border" />
                  <div className="h-10 w-24 bg-neutral-50 animate-pulse border border-border" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
