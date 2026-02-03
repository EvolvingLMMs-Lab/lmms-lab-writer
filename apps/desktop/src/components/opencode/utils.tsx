export function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "now";
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatValue(value: unknown): string {
  if (typeof value === "string") {
    return value.length > 300 ? value.slice(0, 300) + "..." : value;
  }
  if (value === null || value === undefined) {
    return String(value);
  }
  const json = JSON.stringify(value, null, 2);
  return json.length > 300 ? json.slice(0, 300) + "..." : json;
}

export function ErrorMessage({ message }: { message: string }) {
  const urlMatch = message.match(/(https?:\/\/[^\s]+)/);
  const url = urlMatch?.[1];

  if (url) {
    const parts = message.split(url);

    const handleClick = () => {
      import("@tauri-apps/plugin-shell").then(({ open }) => {
        open(url);
      });
    };

    return (
      <>
        {parts[0]}
        <button
          onClick={handleClick}
          className="underline hover:text-red-900 font-medium"
        >
          {url.includes("billing") ? "Add payment method" : url}
        </button>
        {parts[1]}
      </>
    );
  }

  return <>{message}</>;
}
