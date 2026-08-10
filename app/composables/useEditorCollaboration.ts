import type { Extensions } from "@tiptap/core";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCaret from "@tiptap/extension-collaboration-caret";
import { useThrottleFn } from "@vueuse/core";
import YPartyKitProvider from "y-partykit/provider";
import * as Y from "yjs";

export interface CollaborationUser {
  name: string;
  color: string;
  avatar?: string;
}

export interface CollaborationOptions {
  room?: string;
  user: CollaborationUser;
  host?: string;
}

export const COLORS: Record<string, string> = {
  amber: "#fbbf24",
  blue: "#60a5fa",
  cyan: "#22d3ee",
  emerald: "#34d399",
  fuchsia: "#e879f9",
  green: "#4ade80",
  indigo: "#818cf8",
  lime: "#a3e635",
  orange: "#fb923c",
  pink: "#f472b6",
  purple: "#c084fc",
  red: "#f87171",
  rose: "#fb7185",
  sky: "#38bdf8",
  teal: "#2dd4bf",
  violet: "#a78bfa",
  yellow: "#facc15",
};

const ADJECTIVES = [
  "Swift",
  "Clever",
  "Bright",
  "Quick",
  "Sharp",
  "Bold",
  "Calm",
  "Kind",
  "Brave",
  "Wise",
  "Noble",
  "Mighty",
  "Gentle",
  "Fierce",
  "Silent",
  "Wild",
  "Golden",
  "Silver",
  "Cosmic",
  "Lucky",
  "Mystic",
  "Stellar",
  "Radiant",
  "Daring",
];
const ANIMALS = [
  "Fox",
  "Owl",
  "Bear",
  "Wolf",
  "Eagle",
  "Hawk",
  "Lion",
  "Tiger",
  "Falcon",
  "Panther",
  "Dolphin",
  "Phoenix",
  "Dragon",
  "Raven",
  "Lynx",
  "Otter",
  "Stag",
  "Cobra",
  "Jaguar",
  "Crane",
  "Badger",
  "Viper",
  "Condor",
  "Gazelle",
];

export const getRandomColor = () => {
  const keys = Object.keys(COLORS);

  return keys[Math.floor(Math.random() * keys.length)]!;
};
export const getRandomName = () =>
  `${ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]} ${ANIMALS[Math.floor(Math.random() * ANIMALS.length)]}`;

export function useEditorCollaboration(options: CollaborationOptions) {
  const { room, user, host } = options;

  // Collaboration is only active if both room AND host are provided
  const isEnabled = !!room && !!host;

  const isConnected = ref(false);
  const connectedUsers = ref<CollaborationUser[]>([]);
  const extensions = shallowRef<Extensions>([]);
  const ready = ref(false);

  // Return early if disabled or no host provided
  if (!isEnabled) {
    return {
      connectedUsers,
      enabled: false as const,
      extensions,
      isConnected,
      ready: ref(true), // Always ready when disabled
      updateUser: (_user: Partial<CollaborationUser>) => {},
    };
  }

  // Y.js document
  const ydoc = new Y.Doc();

  // Provider instance
  let provider: YPartyKitProvider | null = null;

  const updateUsers = useThrottleFn(
    () => {
      const states = provider?.awareness?.getStates();
      if (!states) {
        return;
      }

      const users = [...states.entries()]
        .filter(
          (entry): entry is [number, { user: CollaborationUser }] =>
            !!entry[1].user
        )
        .map(([id, state]) => ({ ...state.user, id }));

      if (JSON.stringify(users) !== JSON.stringify(connectedUsers.value)) {
        connectedUsers.value = users;
      }
    },
    100,
    true
  );

  const updateUser = (newUser: Partial<CollaborationUser>) => {
    const current = provider?.awareness?.getLocalState()?.user as
      | CollaborationUser
      | undefined;
    if (current) {
      provider?.awareness?.setLocalStateField("user", {
        ...current,
        ...newUser,
      });
    }
  };

  // Initialize on client
  onMounted(async () => {
    provider = new YPartyKitProvider(host, room, ydoc);
    provider.awareness.setLocalStateField("user", user);

    // Now add caret extension with provider
    extensions.value = [
      Collaboration.configure({ document: ydoc }),
      CollaborationCaret.configure({
        provider,
        user,
      }),
    ];

    // Mark as ready so editor can render
    ready.value = true;

    provider.on("status", ({ status }: { status: string }) => {
      isConnected.value = status === "connected";
      if (status === "connected") {
        updateUsers();
      }
    });

    provider.awareness.on("change", updateUsers);
    provider.awareness.on("update", updateUsers);
    updateUsers();

    isConnected.value = provider.wsconnected;
  });

  // Cleanup
  onUnmounted(() => {
    provider?.destroy();
    ydoc.destroy();
  });

  return {
    connectedUsers,
    enabled: true as const,
    extensions,
    isConnected,
    ready,
    updateUser,
  };
}
