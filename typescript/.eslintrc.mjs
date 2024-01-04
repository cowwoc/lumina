/*
 * Copyright (c) 2024 Gili Tzabari
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
export default {
	"env": {
		"browser": true,
		"es2021": true,
		"node": true
	},
	"extends": [
		"eslint:recommended",
		"plugin:import/recommended",
		"plugin:import/typescript",
		"plugin:@typescript-eslint/recommended",
		// https://typescript-eslint.io/linting/typed-linting/
		"plugin:@typescript-eslint/recommended-type-checked"
	],
	"settings": {
		// https://github.com/import-js/eslint-plugin-import#typescript
		"typescript": true,
		"node": true,
		"import/parsers": {
			"@typescript-eslint/parser": [".mts"]
		},
		// https://github.com/kriasoft/react-starter-kit/issues/1180#issuecomment-436753540
		"import/resolver": {
			"typescript": {
				"alwaysTryTypes": true
			}
		}
	},
	"ignorePatterns": [
		"node_modules",
		"/target/**",
		"./*.mts"
	],
	"parser": "@typescript-eslint/parser",
	"parserOptions": {
		"ecmaVersion": "latest",
		"sourceType": "module",
		"project": "tsconfig.json"
	},
	"plugins": [
		"@typescript-eslint",
		"eslint-plugin-tsdoc"
	],
	"rules": {
		// "indent" is broken for Typescript: https://github.com/typescript-eslint/typescript-eslint/issues/1824
		"indent": "off",
		"quotes": [
			"error",
			"double"
		],
		"semi": [
			"error",
			"always"
		],
		"tsdoc/syntax": "warn",
		// Prevents "while(true)"
		"no-constant-condition": "off",
		"no-mixed-spaces-and-tabs": [
			"error",
			"smart-tabs"
		],
		"@typescript-eslint/restrict-template-expressions": "off"
	}
};