import type { Metadata } from "next";
import { SDKExplorerIframe } from "@/components/SDKExplorerIframe";

export const metadata: Metadata = {
  title: "SDK Explorer — Agentuity Docs",
  description: "Interactive examples showcasing the Agentuity v1 platform",
};

export default function SDKExplorerPage() {
  return (
    <div className="sdk-explorer-wrapper">
      <SDKExplorerIframe />
    </div>
  );
}
