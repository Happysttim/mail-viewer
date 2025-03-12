import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylisticJs from "@stylistic/eslint-plugin-js";
import stylisticTs from "@stylistic/eslint-plugin-ts";
import stylisticJsx from "@stylistic/eslint-plugin-jsx";

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
		ignores: [
			"*.config.*js",
			"*.config.*.ts",
			"/node_modules/"
		],
		plugins: {
			"@stylistic/ts": stylisticTs,
			"@stylistic/jsx": stylisticJsx,
			"@stylistic/js": stylisticJs,
		},
      	rules: {
			"@typescript-eslint/no-extra-non-null-assertion": ["off"],
			"no-useless-escape": ["off"],
			"@typescript-eslint/no-unused-vars": ["off"],
			"@stylistic/js/arrow-parens": ["error", "always"],
			"@stylistic/js/no-extra-semi": ["error"],
			"@stylistic/ts/semi": ["error", "always"],
			"@stylistic/ts/quotes": [
				"error", 
				"double",
				{
					"allowTemplateLiterals": "avoidEscape"
				} 
			],
      	}
    }
);