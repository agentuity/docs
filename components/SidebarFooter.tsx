'use client';

import { ExternalLink } from "lucide-react";

export function SidebarFooter() {
	return <a href="https://v0.agentuity.dev" className="w-full flex items-center justify-center text-xs hover:text-fd-primary">Looking for the old docs? Click here <ExternalLink className="size-3.5 -mt-0.5 ml-1" /></a>;
}
