"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { ObjectBrowser } from "./object-browser";
import { CorsEditor } from "./cors-editor";

type Tab = "objects" | "cors";

interface Props {
  connectionId: string;
  bucket: string;
}

export function BucketView({ connectionId, bucket }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get("tab") as Tab) ?? "objects";

  function setTab(tab: Tab) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "objects", label: "Objects" },
    { id: "cors", label: "CORS" },
  ];

  return (
    <div className="flex h-full flex-col bg-zinc-950">
      <div className="flex items-center border-b border-zinc-800 px-4">
        <span className="mr-4 text-sm font-medium text-zinc-300">{bucket}</span>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setTab(tab.id)}
            className={`relative px-3 py-3 text-xs font-medium transition-colors ${
              activeTab === tab.id ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t bg-emerald-500" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "objects" ? (
          <ObjectBrowser connectionId={connectionId} bucket={bucket} />
        ) : (
          <CorsEditor connectionId={connectionId} bucket={bucket} />
        )}
      </div>
    </div>
  );
}
