import colors from "tailwindcss/colors";

export default {
    content: ["./app/**/*.{js,ts,jsx,tsx}"],
    thema: {
        colors: {
            ...colors,
            success: colors.green,
        }
    },
    plugins: [],
}