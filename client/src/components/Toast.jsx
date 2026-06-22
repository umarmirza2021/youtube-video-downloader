export default function Toast({ message, visible }) {
  if (!visible || !message) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-yt-card border border-yt-border text-yt-text text-sm px-5 py-3 rounded-xl shadow-2xl max-w-sm text-center">
        {message}
      </div>
    </div>
  );
}