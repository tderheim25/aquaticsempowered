"use client";

import {
  Box,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES } from "@/lib/validations/maintenance";
import type { TaskCategory, TaskPriority, TaskStatus } from "@/types/database";

type OrgMember = { id: string; full_name: string | null; email: string };

function memberLabel(m: OrgMember) {
  return m.full_name?.trim() || m.email;
}

export type MaintenanceFilterState = {
  q: string;
  status: TaskStatus | "";
  priority: TaskPriority | "";
  category: TaskCategory | "";
  assignee: string;
  mine: boolean;
  pool: string;
};

type PoolOption = { id: string; name: string };

export function MaintenanceFilters({
  orgMembers,
  pools,
  initial,
}: {
  orgMembers: OrgMember[];
  pools: PoolOption[];
  initial: MaintenanceFilterState;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [qInput, setQInput] = useState(initial.q);

  useEffect(() => {
    setQInput(initial.q);
  }, [initial.q]);

  const pushParams = useCallback(
    (mutate: (p: URLSearchParams) => void) => {
      const p = new URLSearchParams(searchParams.toString());
      mutate(p);
      const s = p.toString();
      router.replace(s ? `${pathname}?${s}` : pathname);
    },
    [pathname, router, searchParams]
  );

  useEffect(() => {
    const t = setTimeout(() => {
      if (qInput === initial.q) return;
      pushParams((p) => {
        if (qInput.trim()) p.set("q", qInput.trim());
        else p.delete("q");
      });
    }, 300);
    return () => clearTimeout(t);
  }, [qInput, initial.q, pushParams]);

  return (
    <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }} flexWrap="wrap" useFlexGap>
      <TextField
        size="small"
        label="Search title"
        value={qInput}
        onChange={(e) => setQInput(e.target.value)}
        sx={{ minWidth: { xs: "100%", md: 200 } }}
      />
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="flt-status">Status</InputLabel>
        <Select
          labelId="flt-status"
          label="Status"
          value={initial.status}
          onChange={(e) => {
            const v = e.target.value as TaskStatus | "";
            pushParams((p) => {
              if (v) p.set("status", v);
              else p.delete("status");
            });
          }}
        >
          <MenuItem value="">All</MenuItem>
          {TASK_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s.replace("_", " ")}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel id="flt-priority">Priority</InputLabel>
        <Select
          labelId="flt-priority"
          label="Priority"
          value={initial.priority}
          onChange={(e) => {
            const v = e.target.value as TaskPriority | "";
            pushParams((p) => {
              if (v) p.set("priority", v);
              else p.delete("priority");
            });
          }}
        >
          <MenuItem value="">All</MenuItem>
          {TASK_PRIORITIES.map((p) => (
            <MenuItem key={p} value={p}>
              {p}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel id="flt-category">Category</InputLabel>
        <Select
          labelId="flt-category"
          label="Category"
          value={initial.category}
          onChange={(e) => {
            const v = e.target.value as TaskCategory | "";
            pushParams((p) => {
              if (v) p.set("category", v);
              else p.delete("category");
            });
          }}
        >
          <MenuItem value="">All</MenuItem>
          {TASK_CATEGORIES.map((c) => (
            <MenuItem key={c} value={c}>
              {c}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {pools.length > 0 ? (
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="flt-pool">Pool</InputLabel>
          <Select
            labelId="flt-pool"
            label="Pool"
            value={initial.pool}
            onChange={(e) => {
              const v = e.target.value;
              pushParams((p) => {
                if (v) p.set("pool", v);
                else p.delete("pool");
              });
            }}
          >
            <MenuItem value="">All pools</MenuItem>
            {pools.map((p) => (
              <MenuItem key={p.id} value={p.id}>
                {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="flt-assignee">Assignee</InputLabel>
        <Select
          labelId="flt-assignee"
          label="Assignee"
          value={initial.assignee}
          disabled={initial.mine}
          onChange={(e) => {
            const v = e.target.value;
            pushParams((p) => {
              if (v) p.set("assignee", v);
              else p.delete("assignee");
            });
          }}
        >
          <MenuItem value="">All</MenuItem>
          {orgMembers.map((m) => (
            <MenuItem key={m.id} value={m.id}>
              {memberLabel(m)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      <Box sx={{ display: "flex", alignItems: "center" }}>
        <FormControlLabel
          control={
            <Switch
              checked={initial.mine}
              onChange={(_, checked) => {
                pushParams((p) => {
                  if (checked) {
                    p.set("mine", "1");
                    p.delete("assignee");
                  } else {
                    p.delete("mine");
                  }
                });
              }}
            />
          }
          label="Only my tasks"
        />
      </Box>
    </Stack>
  );
}
