"use client";

import {
  Box,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { poolOpsTokens } from "@/theme/poolOpsTokens";

export type ChemistryTrendPoint = {
  logged_at: string;
  ph: number | null;
  free_chlorine: number | null;
  alkalinity: number | null;
  temp_f: number | null;
  langelier_saturation_index: number | null;
};

type MetricKey = "ph" | "free_chlorine" | "alkalinity" | "temp_f" | "lsi";

const METRIC_CONFIG: Record<
  MetricKey,
  { label: string; dataKey: keyof ChemistryTrendPoint; color: string; yAxisId?: string }
> = {
  ph: { label: "pH", dataKey: "ph", color: poolOpsTokens.chart[0] },
  free_chlorine: { label: "Free chlorine", dataKey: "free_chlorine", color: poolOpsTokens.chart[1] },
  alkalinity: { label: "Alkalinity", dataKey: "alkalinity", color: poolOpsTokens.chart[2] },
  temp_f: { label: "Temp (°F)", dataKey: "temp_f", color: poolOpsTokens.chart[3] },
  lsi: { label: "LSI", dataKey: "langelier_saturation_index", color: poolOpsTokens.chart[4] },
};

export function ChemistryTrendChart({ points }: { points: ChemistryTrendPoint[] }) {
  const [enabled, setEnabled] = useState<Record<MetricKey, boolean>>({
    ph: true,
    free_chlorine: true,
    alkalinity: false,
    temp_f: false,
    lsi: true,
  });

  const chartData = useMemo(
    () =>
      [...points]
        .sort((a, b) => new Date(a.logged_at).getTime() - new Date(b.logged_at).getTime())
        .map((p) => ({
          ...p,
          label: new Date(p.logged_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }),
        })),
    [points]
  );

  const activeMetrics = (Object.keys(METRIC_CONFIG) as MetricKey[]).filter((k) => enabled[k]);

  if (chartData.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        No readings in this window. Add chemical logs to see trends.
      </Typography>
    );
  }

  return (
    <Stack spacing={2}>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {(Object.keys(METRIC_CONFIG) as MetricKey[]).map((key) => (
          <FormControlLabel
            key={key}
            control={
              <Switch
                size="small"
                checked={enabled[key]}
                onChange={(_, checked) => setEnabled((prev) => ({ ...prev, [key]: checked }))}
              />
            }
            label={METRIC_CONFIG[key].label}
          />
        ))}
      </Stack>
      <Box sx={{ width: "100%", height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            {activeMetrics.map((key) => {
              const cfg = METRIC_CONFIG[key];
              const axis = key === "temp_f" || key === "alkalinity" ? "right" : "left";
              return (
                <Line
                  key={key}
                  yAxisId={axis}
                  type="monotone"
                  dataKey={cfg.dataKey}
                  name={cfg.label}
                  stroke={cfg.color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </Box>
    </Stack>
  );
}
