import type { EditorEmojiMenuItem } from "@nuxt/ui";
import { Emoji, gitHubEmojis, shortcodeToEmoji } from "@tiptap/extension-emoji";

export function useEditorEmojis() {
  const items: EditorEmojiMenuItem[] = gitHubEmojis.filter(
    (emoji) => !emoji.name.startsWith("regional_indicator_")
  );

  const extension = Emoji.extend({
    markdownTokenName: "emoji",
    markdownTokenizer: {
      level: "inline",
      name: "emoji",
      start: ":",
      tokenize(src) {
        const match = src.match(/^:([a-zA-Z0-9_+-]+):/);
        if (!match?.[1]) {
          return undefined;
        }
        if (!shortcodeToEmoji(match[1], gitHubEmojis)) {
          return undefined;
        }
        return { name: match[1], raw: match[0], type: "emoji" };
      },
    },
    parseMarkdown(token, { createNode }) {
      return createNode("emoji", { name: token.name });
    },
    renderMarkdown(node) {
      if (!node.attrs?.name) {
        return "";
      }
      const emojiItem = shortcodeToEmoji(node.attrs.name, gitHubEmojis);
      return emojiItem?.emoji || `:${node.attrs.name}:`;
    },
  });

  return {
    extension,
    items,
  };
}
