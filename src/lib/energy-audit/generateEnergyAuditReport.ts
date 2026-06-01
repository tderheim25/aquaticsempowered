import "server-only";

import {
  buildEnergyAuditUserPrompt,
  ENERGY_AUDIT_SYSTEM_PROMPT,
  type EnergyAuditInput,
} from "@/lib/energy-audit/prompt";

function buildFallbackReport(input: EnergyAuditInput) {
  const name = input.facilityName;
  return `## Executive summary

This energy audit for **${name}** is a planning guide based on the information you provided. Findings should be confirmed on site before capital decisions.

## Facility snapshot

- **Facility:** ${name}
- **Type:** ${input.facilityType || "Not specified"}
- **Body of water:** ${input.bodyOfWater || "Not specified"}
- **Size:** ${input.sizeNotes || "Not specified"}

## Pump & circulation

Review pump run times against required turnover. Variable-speed pumps on single-speed schedules are a common savings opportunity.

## Heating & dehumidification

Confirm cover use, setpoints, and whether heaters run during unoccupied periods.

## Schedules & controls

Document current timers and align run hours with bather load and season.

## Key findings

- Operating data should be validated on site.
- Equipment age and condition affect savings potential.
- Schedule optimization is often the fastest win.

## Recommendations

1. **High:** Log pump run hours and compare to code turnover requirements.
2. **High:** Audit heater and dehumidifier setpoints.
3. **Medium:** Evaluate LED pool lighting and motor upgrades at end of life.
4. **Low:** Plan a formal measurement-based audit when capital planning begins.

## Next steps for leadership

Share this summary with your operator and revisit after 30 days of basic run-time logs.`;
}

export async function generateEnergyAuditReport(input: EnergyAuditInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return buildFallbackReport(input);
  }

  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      messages: [
        { role: "system", content: ENERGY_AUDIT_SYSTEM_PROMPT },
        { role: "user", content: buildEnergyAuditUserPrompt(input) },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("[generateEnergyAuditReport] OpenAI error:", res.status, errText);
    return buildFallbackReport(input);
  }

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };

  const content = json.choices?.[0]?.message?.content?.trim();
  return content || buildFallbackReport(input);
}
