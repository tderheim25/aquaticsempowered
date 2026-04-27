"use client";

import { Button, type ButtonProps } from "@mui/material";

import { captureEvent } from "@/lib/posthog";

type Props = ButtonProps & {
  eventName: string;
  eventProps?: Record<string, unknown>;
};

export function TrackedButton({ eventName, eventProps, onClick, ...rest }: Props) {
  return (
    <Button
      {...rest}
      onClick={(e) => {
        captureEvent(eventName, eventProps);
        onClick?.(e);
      }}
    />
  );
}
