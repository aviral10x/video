import type { Config } from "tailwindcss";

const config: Config = {
    content: ["./src/**/*.{ts,tsx}"],
    theme: {
        extend: {
            fontFamily: {
                sans: ["Inter", "system-ui", "sans-serif"],
            },
            colors: {
                surface: {
                    DEFAULT: "#0A0A0F",
                    card: "#141420",
                    hover: "#1C1C2E",
                    border: "#2A2A3E",
                },
                accent: {
                    DEFAULT: "#6366F1",
                    pink: "#F43F5E",
                    sky: "#0EA5E9",
                },
            },
        },
    },
    plugins: [],
};

export default config;
