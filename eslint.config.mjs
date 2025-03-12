import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
      	rules: {
			"@typescript-eslint/no-extra-non-null-assertion": ["off"],
			"no-useless-escape": ["off"],
			"@typescript-eslint/no-unused-vars": ["warn"],
      	}
    }
);