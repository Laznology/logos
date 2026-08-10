import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import jsPlugins from "ultracite/oxlint/js-plugins";
import vue from "ultracite/oxlint/vue";

const selectedJsPluginNames = new Set(["github", "sonarjs"]);
const selectedJsPluginRulePrefixes = new Set(["github", "sonarjs"]);

const selectedJsPlugins = {
  ...jsPlugins,
  jsPlugins: jsPlugins.jsPlugins?.filter((plugin) =>
    selectedJsPluginNames.has(typeof plugin === "string" ? plugin : plugin.name)
  ),
  overrides: jsPlugins.overrides?.map((override) => ({
    ...override,
    rules: Object.fromEntries(
      Object.entries(override.rules ?? {}).filter(([ruleName]) =>
        selectedJsPluginRulePrefixes.has(ruleName.split("/")[0] ?? ruleName)
      )
    ),
  })),
  rules: Object.fromEntries(
    Object.entries(jsPlugins.rules ?? {}).filter(([ruleName]) =>
      selectedJsPluginRulePrefixes.has(ruleName.split("/")[0] ?? ruleName)
    )
  ),
};
export default defineConfig({
  extends: [core, vue, selectedJsPlugins],
  ignorePatterns: core.ignorePatterns,
  rules: {
    "unicorn/filename-case": "off",
    "github/filenames-match-regex": "off",
    "unicorn/no-useless-switch-case": "off",
    "eslint/require-await": "off",
    "eslint/no-shadow": "off",
    "eslint/func-style": "off",
    "jsdoc/check-tag-names": "off",
    "sonarjs/function-name": "off",
    "sonarjs/destructuring-assignment-syntax": "off",
    "eslint/prefer-destructuring": "off",
    "sonarjs/no-undefined-assignment": "off",
    "eslint/require-unicode-regexp": "off",
    "typescript/no-non-null-assertion": "off",
    "eslint/complexity": "off",
    "sonarjs/cognitive-complexity": "off",
    "unicorn/consistent-function-scoping": "off",
    "oxc/branches-sharing-code": "off",
    "import/no-named-as-default": "off",
    "eslint/no-inline-comments": "off",
    "eslint/no-empty-function": "off",
    "sonarjs/no-wildcard-import": "off",
    "sonarjs/pseudo-random": "off",
    "eslint/sort-keys": "off",
    "eslint/prefer-named-capture-group": "off",
    "unicorn/no-useless-undefined": "off",
    "github/array-foreach": "off",
    "unicorn/no-array-reverse": "off",
    "unicorn/no-array-for-each": "off",
  },
});
