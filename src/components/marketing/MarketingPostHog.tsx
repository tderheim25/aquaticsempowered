"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { captureEvent, initPosthog } from "@/lib/posthog";

export function MarketingPostHog() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initPosthog();
    if (pathname) {
      captureEvent("page_view", {
        path: pathname,
        search: searchParams?.toString() || "",
      });
    }
  }, [pathname, searchParams]);

  return null;
}
