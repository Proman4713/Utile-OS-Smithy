import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import { defineConfig } from "eslint/config";

export default defineConfig([
	{
		files: ["**/*.{js,jsx}"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.browser,
				...globals.node, // Optional: remove if you want to isolate client/server
				global: "readonly",
			},
			parserOptions: {
				ecmaFeatures: { jsx: true },
			},
		},
		plugins: {
			react: pluginReact,
			"react-hooks": pluginReactHooks,
		},
		rules: {
			...js.configs.recommended.rules,
			...pluginReact.configs.recommended.rules,
			...pluginReactHooks.configs.recommended.rules,
			eqeqeq: "error",
			"no-unused-vars": "warn",
			"no-constant-condition": "off",
			"no-constant-binary-expression": "off",
			"no-extra-boolean-cast": "warn",
			"no-undef": "error",
			"no-unreachable": "warn",
			"no-useless-escape": "warn",
			"no-async-promise-executor": "warn",
			"react/display-name": "off",
			"react/react-in-jsx-scope": "off",
			"react/prop-types": "off"	// Optional, disable if not using PropTypes
		},
		settings: {
			react: {
				version: "detect",
			},
		},
		ignores: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/.build/**", "**/.vite/**"],
	},
]);
