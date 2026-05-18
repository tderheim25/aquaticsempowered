"use client";

import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

export type TrainingCoursePreview = {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  durationLabel: string;
  /** Placeholder thumbnail — replace with real course artwork later. */
  thumbnailUrl: string;
  thumbnailAlt: string;
};

type Props = {
  courses: TrainingCoursePreview[];
};

export function TrainingCourseCatalog({ courses }: Props) {
  return (
    <Grid container spacing={2}>
      {courses.map((course) => (
        <Grid key={course.id} size={{ xs: 12, sm: 6, lg: 4 }}>
          <Card
            variant="outlined"
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              transition: (theme) =>
                theme.transitions.create(["box-shadow", "transform"], { duration: theme.transitions.duration.shorter }),
              "&:hover": {
                boxShadow: 3,
                transform: "translateY(-2px)",
              },
            }}
          >
            <Box
              sx={{
                position: "relative",
                width: "100%",
                pt: "56.25%",
                bgcolor: "grey.200",
              }}
            >
              <Box
                component="img"
                src={course.thumbnailUrl}
                alt={course.thumbnailAlt}
                sx={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: "rgba(0,0,0,0.38)",
                }}
                aria-hidden
              >
                <PlayCircleOutlineIcon sx={{ fontSize: 56, color: "common.white", opacity: 0.95 }} />
              </Box>
              <Chip
                label={course.durationLabel}
                size="small"
                sx={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  fontWeight: 600,
                  bgcolor: "rgba(0,0,0,0.72)",
                  color: "common.white",
                  "& .MuiChip-label": { px: 1 },
                }}
              />
            </Box>
            <CardContent sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 0.75, pt: 1.5 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
                <Chip label={course.category} size="small" color="primary" variant="outlined" sx={{ fontWeight: 600 }} />
                <Typography variant="caption" color="text.secondary">
                  Placeholder
                </Typography>
              </Stack>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                {course.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
                {course.subtitle}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
