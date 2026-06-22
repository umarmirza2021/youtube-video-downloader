import { getApiUrl, isApiConfigured } from '../config/env.js';

export default function ApiBanner({ apiOk }) {
  if (isApiConfigured() && apiOk !== false) return null;

  const apiUrl = getApiUrl();

  return (
    <div className="bg-amber-950/60 border border-amber-700/50 text-amber-200 px-4 py-3 rounded-xl text-sm space-y-2">
      <p className="font-medium">API not connected</p>
      <p className="text-xs text-amber-200/80">
        The download server is offline or misconfigured. If you self-host, ensure the API is running
        and reachable at <code className="bg-black/30 px-1 rounded">/api</code>.
      </p>
      {apiUrl && (
        <p className="text-[10px] text-amber-200/60">API endpoint: {apiUrl}</p>
      )}
    </div>
  );
}