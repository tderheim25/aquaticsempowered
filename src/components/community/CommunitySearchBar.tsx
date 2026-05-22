"use client";

import BusinessIcon from "@mui/icons-material/Business";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import StorefrontIcon from "@mui/icons-material/Storefront";
import {
  Box,
  CircularProgress,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import type { CommunitySearchResult } from "@/app/api/community/search/route";

import { communitySearchFieldSx } from "./communityUi";

/** Stable id so MUI does not auto-generate mismatched useId() between SSR and hydration. */
const COMMUNITY_SEARCH_INPUT_ID = "community-search-input";

const TYPE_LABELS: Record<CommunitySearchResult["type"], string> = {
  user: "People",
  vendor: "Vendors",
  organization: "Organizations",
};

function TypeIcon({ type }: { type: CommunitySearchResult["type"] }) {
  if (type === "user") return <PersonIcon fontSize="small" color="action" />;
  if (type === "vendor") return <StorefrontIcon fontSize="small" color="action" />;
  return <BusinessIcon fontSize="small" color="action" />;
}

export function CommunitySearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CommunitySearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/community/search?q=${encodeURIComponent(trimmed)}`);
      if (!res.ok) {
        setResults([]);
        return;
      }
      const data = (await res.json()) as { results?: CommunitySearchResult[] };
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    debounceRef.current = setTimeout(() => void runSearch(query), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const grouped = results.reduce(
    (acc, r) => {
      (acc[r.type] ??= []).push(r);
      return acc;
    },
    {} as Record<CommunitySearchResult["type"], CommunitySearchResult[]>
  );

  const showDropdown = open && query.trim().length >= 2;

  return (
    <Box ref={wrapRef} sx={{ position: "relative", width: "100%" }}>
      <TextField
        id={COMMUNITY_SEARCH_INPUT_ID}
        name="community-search"
        fullWidth
        size="small"
        sx={communitySearchFieldSx}
        placeholder="Search people, vendors, or organizations…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        autoComplete="off"
        slotProps={{
          input: {
            id: COMMUNITY_SEARCH_INPUT_ID,
            autoComplete: "off",
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
            endAdornment: loading ? (
              <InputAdornment position="end">
                <CircularProgress size={18} />
              </InputAdornment>
            ) : undefined,
          },
        }}
      />
      {showDropdown ? (
        <Paper
          variant="outlined"
          sx={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 20,
            mt: 0.5,
            maxHeight: 360,
            overflow: "auto",
          }}
        >
          {results.length === 0 && !loading ? (
            <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
              No matches for &ldquo;{query.trim()}&rdquo;.
            </Typography>
          ) : null}
          {(["user", "vendor", "organization"] as const).map((type) => {
            const items = grouped[type];
            if (!items?.length) return null;
            return (
              <Box key={type}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ px: 2, pt: 1.5, pb: 0.5, display: "block", fontWeight: 700 }}
                >
                  {TYPE_LABELS[type]}
                </Typography>
                <List dense disablePadding>
                  {items.map((item) => (
                    <ListItemButton
                      key={`${item.type}-${item.id}`}
                      component={Link}
                      href={item.href}
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <TypeIcon type={item.type} />
                      </ListItemIcon>
                      <ListItemText primary={item.label} secondary={item.subtitle} />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            );
          })}
        </Paper>
      ) : null}
    </Box>
  );
}
