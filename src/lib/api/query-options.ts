import { queryOptions } from "@tanstack/preact-query";

import {
    loadAppPreferences,
    loadCharacter,
    loadCharacterSummaries,
    loadChat,
    loadChatSummaries,
    loadConnectionSecrets,
    loadConnectionSettings,
    loadLorebook,
    loadLorebookSummaries,
    loadPersona,
    loadPersonaSummaries,
    loadPluginManifests,
    loadPluginProfiles,
    loadPluginRegistry,
    loadPluginStorageSnapshot,
    loadPresetCollection,
} from "./client";

const staticDataStaleTimeMs = 30_000;

export const queryKeys = {
    appPreferences: ["app-preferences"] as const,
    characters: {
        all: ["characters"] as const,
        detail: (characterId: string) => ["characters", "detail", characterId] as const,
        summaries: ["characters", "summaries"] as const,
    },
    chats: {
        all: ["chats"] as const,
        detail: (chatId: string) => ["chats", "detail", chatId] as const,
        summaries: ["chats", "summaries"] as const,
    },
    connections: {
        all: ["connections"] as const,
        secrets: ["connections", "secrets"] as const,
        settings: ["connections", "settings"] as const,
    },
    lorebooks: {
        all: ["lorebooks"] as const,
        detail: (lorebookId: string) => ["lorebooks", "detail", lorebookId] as const,
        summaries: ["lorebooks", "summaries"] as const,
    },
    personas: {
        all: ["personas"] as const,
        detail: (personaId: string) => ["personas", "detail", personaId] as const,
        summaries: ["personas", "summaries"] as const,
    },
    plugins: {
        all: ["plugins"] as const,
        manifests: ["plugins", "manifests"] as const,
        profiles: ["plugins", "profiles"] as const,
        registry: ["plugins", "registry"] as const,
        storage: (pluginId: string) => ["plugins", "storage", pluginId] as const,
    },
    presets: ["presets"] as const,
};

export const queryStore = {
    appPreferences: queryOptions({
        queryKey: queryKeys.appPreferences,
        queryFn: loadAppPreferences,
        staleTime: staticDataStaleTimeMs,
    }),
    character: (characterId: string) =>
        queryOptions({
            queryKey: queryKeys.characters.detail(characterId),
            queryFn: () => loadCharacter(characterId),
        }),
    characterSummaries: queryOptions({
        queryKey: queryKeys.characters.summaries,
        queryFn: loadCharacterSummaries,
        staleTime: staticDataStaleTimeMs,
    }),
    chat: (chatId: string) =>
        queryOptions({
            queryKey: queryKeys.chats.detail(chatId),
            queryFn: () => loadChat(chatId),
        }),
    chatSummaries: queryOptions({
        queryKey: queryKeys.chats.summaries,
        queryFn: loadChatSummaries,
        staleTime: staticDataStaleTimeMs,
    }),
    connectionSecrets: queryOptions({
        queryKey: queryKeys.connections.secrets,
        queryFn: loadConnectionSecrets,
        staleTime: staticDataStaleTimeMs,
    }),
    connectionSettings: queryOptions({
        queryKey: queryKeys.connections.settings,
        queryFn: loadConnectionSettings,
        staleTime: staticDataStaleTimeMs,
    }),
    lorebook: (lorebookId: string) =>
        queryOptions({
            queryKey: queryKeys.lorebooks.detail(lorebookId),
            queryFn: () => loadLorebook(lorebookId),
        }),
    lorebookSummaries: queryOptions({
        queryKey: queryKeys.lorebooks.summaries,
        queryFn: loadLorebookSummaries,
        staleTime: staticDataStaleTimeMs,
    }),
    persona: (personaId: string) =>
        queryOptions({
            queryKey: queryKeys.personas.detail(personaId),
            queryFn: () => loadPersona(personaId),
        }),
    personaSummaries: queryOptions({
        queryKey: queryKeys.personas.summaries,
        queryFn: loadPersonaSummaries,
        staleTime: staticDataStaleTimeMs,
    }),
    pluginManifests: queryOptions({
        queryKey: queryKeys.plugins.manifests,
        queryFn: loadPluginManifests,
        staleTime: staticDataStaleTimeMs,
    }),
    pluginProfiles: queryOptions({
        queryKey: queryKeys.plugins.profiles,
        queryFn: loadPluginProfiles,
        staleTime: staticDataStaleTimeMs,
    }),
    pluginRegistry: queryOptions({
        queryKey: queryKeys.plugins.registry,
        queryFn: loadPluginRegistry,
        staleTime: staticDataStaleTimeMs,
    }),
    pluginStorage: (pluginId: string) =>
        queryOptions({
            queryKey: queryKeys.plugins.storage(pluginId),
            queryFn: () => loadPluginStorageSnapshot(pluginId),
        }),
    presets: queryOptions({
        queryKey: queryKeys.presets,
        queryFn: loadPresetCollection,
        staleTime: staticDataStaleTimeMs,
    }),
};
