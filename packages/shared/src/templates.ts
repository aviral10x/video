import type { TemplateConfig } from "./types";

export const TEMPLATES: TemplateConfig[] = [
    {
        id: "clean-creator",
        name: "Clean Creator",
        description:
            "Minimal, modern look. Soft captions with a gentle fade-in hook and a clean CTA slide.",
        thumbnail: "/templates/clean-creator.png",
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
            position: "bottom",
        },
        zoom: {
            scale: 1.15,
            durationSec: 0.6,
            easing: "ease-in-out",
        },
        cta: {
            durationSec: 2,
            background: "#6366F1",
            textColor: "#FFFFFF",
            fontSize: 48,
            buttonText: "Follow for more",
        },
    },
    {
        id: "viral-punch",
        name: "Viral Punch",
        description:
            "High-energy style. Bold captions, fast zooms, and punchy colour accents for maximum engagement.",
        thumbnail: "/templates/viral-punch.png",
        accentColor: "#F43F5E",
        hook: {
            durationSec: 2,
            background: "#18181B",
            textColor: "#FDE68A",
            fontSize: 72,
        },
        caption: {
            fontFamily: "Inter",
            fontSize: 48,
            color: "#FFFFFF",
            backgroundColor: "rgba(0,0,0,0.7)",
            highlightColor: "#F43F5E",
            position: "bottom",
        },
        zoom: {
            scale: 1.3,
            durationSec: 0.35,
            easing: "spring",
        },
        cta: {
            durationSec: 2,
            background: "#F43F5E",
            textColor: "#FFFFFF",
            fontSize: 52,
            buttonText: "Subscribe now!",
        },
    },
    {
        id: "branded-explainer",
        name: "Branded Explainer",
        description:
            "Professional polish. Centred captions, subtle zooms, and a branded end card with your accent colour.",
        thumbnail: "/templates/branded-explainer.png",
        accentColor: "#0EA5E9",
        hook: {
            durationSec: 2,
            background: "#020617",
            textColor: "#E0F2FE",
            fontSize: 60,
        },
        caption: {
            fontFamily: "Inter",
            fontSize: 40,
            color: "#F0F9FF",
            backgroundColor: "rgba(2,6,23,0.65)",
            highlightColor: "#0EA5E9",
            position: "center",
        },
        zoom: {
            scale: 1.1,
            durationSec: 0.8,
            easing: "ease-in-out",
        },
        cta: {
            durationSec: 2,
            background: "#0EA5E9",
            textColor: "#FFFFFF",
            fontSize: 46,
            buttonText: "Learn more",
        },
    },
];

export function getTemplateById(id: string): TemplateConfig | undefined {
    return TEMPLATES.find((t) => t.id === id);
}
