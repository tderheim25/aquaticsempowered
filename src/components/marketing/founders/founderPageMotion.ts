import { keyframes } from "@emotion/react";

export const founderFloat = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, -14px, 0) scale(1.04); }
`;

export const founderFloatReverse = keyframes`
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(0, 12px, 0) scale(1.05); }
`;

export const founderShimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

export const founderFadeUp = keyframes`
  from { opacity: 0; transform: translate3d(0, 18px, 0); }
  to { opacity: 1; transform: translate3d(0, 0, 0); }
`;

export const founderPulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(46, 165, 160, 0.45); }
  50% { box-shadow: 0 0 0 8px rgba(46, 165, 160, 0); }
`;
