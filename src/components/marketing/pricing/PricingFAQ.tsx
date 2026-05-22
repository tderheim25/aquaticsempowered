"use client";

import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import { faqs } from "./pricingData";
import { useReveal } from "./useReveal";

export function PricingFAQ() {
  const { ref, visible } = useReveal<HTMLDivElement>();

  return (
    <Container maxWidth="md" sx={{ py: { xs: 6, md: 10 } }}>
      <Stack
        ref={ref}
        spacing={1.5}
        sx={{
          textAlign: "center",
          mb: 5,
          opacity: visible ? 1 : 0,
          transform: visible ? "none" : "translate3d(0, 18px, 0)",
          transition: "opacity 700ms ease, transform 700ms ease",
        }}
      >
        <Typography
          variant="overline"
          sx={{ color: "secondary.main", letterSpacing: "0.16em", fontWeight: 700 }}
        >
          Frequently asked
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Questions, answered
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Still curious? Reach out to the team and we&apos;ll help you pick the right tier.
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        {faqs.map((f, i) => (
          <Accordion
            key={f.q}
            disableGutters
            elevation={0}
            sx={{
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: "background.paper",
              opacity: visible ? 1 : 0,
              transform: visible ? "none" : "translate3d(0, 14px, 0)",
              transition: `opacity 600ms ease ${i * 70}ms, transform 600ms ease ${i * 70}ms, border-color 240ms ease, box-shadow 240ms ease`,
              "&:before": { display: "none" },
              "&:hover": {
                borderColor: "rgba(46,165,160,0.5)",
                boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
              },
              "&.Mui-expanded": {
                borderColor: "secondary.main",
                boxShadow: "0 14px 32px rgba(15,23,42,0.08)",
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreRoundedIcon />}
              sx={{
                px: 2.5,
                py: 0.5,
                minHeight: 56,
                "& .MuiAccordionSummary-content": { my: 1.25 },
                "& .MuiAccordionSummary-expandIconWrapper": {
                  transition: "transform 320ms cubic-bezier(0.2, 0.8, 0.2, 1), color 240ms ease",
                  color: "text.secondary",
                },
                "&.Mui-expanded .MuiAccordionSummary-expandIconWrapper": {
                  color: "secondary.main",
                },
              }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {f.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ px: 2.5, pb: 2.5, pt: 0 }}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                {f.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Stack>
    </Container>
  );
}
