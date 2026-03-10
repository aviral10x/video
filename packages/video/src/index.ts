export * from "./VideoComposition";
export { HookCard } from "./components/HookCard";
export { CTAEndCard } from "./components/CTAEndCard";
export { Captions } from "./components/Captions";
export { PunchInZoomLayer } from "./components/PunchInZoomLayer";
export * from "./types";

/** Path to the Remotion root entry for SSR bundling */
export const REMOTION_ENTRY_POINT = require.resolve("./root");
