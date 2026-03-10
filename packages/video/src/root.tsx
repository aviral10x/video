/**
 * Remotion entry point for server-side rendering.
 * This file registers the composition that renderMedia() will use.
 */
import { registerRoot } from "remotion";
import { Composition } from "remotion";
import React from "react";
import { VideoComposition } from "./VideoComposition";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const VideoComp = VideoComposition as any;

const Root: React.FC = () => {
    return (
        <Composition
            id="VideoEditor"
            component={VideoComp}
            durationInFrames={450}
            fps={30}
            width={1080}
            height={1920}
            defaultProps={{
                sourceVideoUrl: "",
                transcriptWords: [],
                templateConfig: {
                    id: "clean-creator",
                    name: "Clean Creator",
                    description: "",
                    accentColor: "#6366F1",
                    hook: {
                        durationSec: 2,
                        background: "#0F172A",
                        textColor: "#F8FAFC",
                        fontSize: 64,
                    },
                    caption: {
                        fontFamily: "Inter",
                        fontSize: 42,
                        color: "#FFFFFF",
                        backgroundColor: "rgba(0,0,0,0.5)",
                        highlightColor: "#6366F1",
                        position: "bottom" as const,
                    },
                    zoom: {
                        scale: 1.15,
                        durationSec: 0.6,
                        easing: "ease-in-out" as const,
                    },
                    cta: {
                        durationSec: 2,
                        background: "#6366F1",
                        textColor: "#FFFFFF",
                        fontSize: 48,
                        buttonText: "Follow for more",
                    },
                },
                hookText: "",
                ctaText: "",
                zoomTimestamps: [],
                durationInFrames: 450,
                fps: 30,
            }}
        />
    );
};

registerRoot(Root);
