import ultraciteOxfmt from "ultracite/oxfmt";
import core from "ultracite/oxlint/core";
import jsPlugins from "ultracite/oxlint/js-plugins";
import vue from "ultracite/oxlint/vue";
import { defineConfig } from "vite-plus";

const selectedJsPluginNames: Record<string, true> = {
  github: true,
  sonarjs: true,
};
const selectedJsPluginRulePrefixes: Record<string, true> = {
  github: true,
  sonarjs: true,
};

const selectedJsPlugins = {
  ...jsPlugins,
  jsPlugins: jsPlugins.jsPlugins?.filter((plugin) => {
    const name = typeof plugin === "string" ? plugin : plugin.name;
    return name in selectedJsPluginNames;
  }),
  overrides: jsPlugins.overrides?.map((override) => ({
    ...override,
    rules: Object.fromEntries(
      Object.entries(override.rules ?? {}).filter(
        ([ruleName]) =>
          (ruleName.split("/")[0] ?? ruleName) in selectedJsPluginRulePrefixes
      )
    ),
  })),
  rules: Object.fromEntries(
    Object.entries(jsPlugins.rules ?? {}).filter(
      ([ruleName]) =>
        (ruleName.split("/")[0] ?? ruleName) in selectedJsPluginRulePrefixes
    )
  ),
};

export default defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ...ultraciteOxfmt,
  },
  lint: {
    extends: [core, vue, selectedJsPlugins],
    ignorePatterns: core.ignorePatterns,
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
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
      "vite-plus/prefer-vite-plus-imports": "error",
    },
  },
});
