import colors from "tailwindcss/colors";
import plugin from "tailwindcss/plugin";

delete colors.lightBlue;
delete colors.warmGray;
delete colors.trueGray;
delete colors.coolGray;
delete colors.blueGray;

export default {
    content: ["./app/**/*.{js,ts,jsx,tsx}"],
    thema: {
        colors: {
            ...colors,
            danger: colors.red,
            success: colors.green,
            lightAmber: "#E8B274",
        },
    },
    plugins: [
        plugin(
            ({ addUtilities, addVariant, e }) => {
                addUtilities({
                    ".appRegionDrag": {
                        "-webkit-app-region": "drag",
                    },
                    ".appRegionNoDrag": {
                        "-webkit-app-region": "no-drag",
                    },
                });
                addVariant(
                    "not-last",
                    ({ modifySelectors, separator }) => {
                        modifySelectors(({ className }) => {
                            return `.not-last${e(`${separator}${className}`)}:not(:last-child)`;
                        });
                    }
                );
                addVariant(
                    "not-first",
                    ({ modifySelectors, separator }) => {
                        modifySelectors(({ className }) => {
                            return `.not-first${e(`${separator}${className}`)}:not(:first-child)`;
                        });
                    }
                );
            }
        ),
    ],
}