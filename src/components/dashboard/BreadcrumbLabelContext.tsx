"use client";

import { createContext, useContext, useLayoutEffect, useMemo, useState } from "react";

type BreadcrumbLabelContextValue = {
  lastLabel: string | null;
  setLastLabel: (label: string | null) => void;
};

const BreadcrumbLabelContext = createContext<BreadcrumbLabelContextValue | null>(null);

export function BreadcrumbLabelProvider({ children }: { children: React.ReactNode }) {
  const [lastLabel, setLastLabel] = useState<string | null>(null);
  const value = useMemo(() => ({ lastLabel, setLastLabel }), [lastLabel]);
  return <BreadcrumbLabelContext.Provider value={value}>{children}</BreadcrumbLabelContext.Provider>;
}

export function useBreadcrumbLastLabel() {
  return useContext(BreadcrumbLabelContext)?.lastLabel ?? null;
}

/** Set the last breadcrumb label before paint (e.g. profile display name). */
export function SetBreadcrumbLastLabel({ label }: { label: string }) {
  const setLastLabel = useContext(BreadcrumbLabelContext)?.setLastLabel;
  useLayoutEffect(() => {
    if (!setLastLabel) return;
    setLastLabel(label);
    return () => setLastLabel(null);
  }, [label, setLastLabel]);
  return null;
}
