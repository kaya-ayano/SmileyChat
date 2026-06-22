import { mutationOptions } from "@tanstack/preact-query";

import type { ConnectionSecrets, ConnectionSettings } from "../connections/config";
import type { Lorebook } from "../lorebooks/types";
import type { PluginProfilesState } from "../plugins/profiles";
import type { AppPreferences } from "../preferences/types";
import type { PresetCollection } from "../presets/types";
import type {
    CharacterSummaryCollection,
    ChatSession,
    ChatSummaryCollection,
    SmileyCharacter,
    SmileyPersona,
} from "#frontend/types";

import {
    createCharacter,
    createChat,
    createPersona,
    deleteCharacter,
    deleteChat,
    deleteChatAttachment,
    deleteLorebook,
    deletePersona,
    deletePluginProfile,
    exportCharacterCard,
    exportLorebook,
    importCharacterFiles,
    importChatFile,
    importLorebookFiles,
    installManualArtifact,
    installPlugin,
    saveAppPreferences,
    saveCharacter,
    saveCharacterIndex,
    saveChat,
    saveChatIndex,
    saveConnectionSecrets,
    saveConnectionSettings,
    saveLorebook,
    savePersona,
    savePersonaIndex,
    savePluginEnabled,
    savePluginProfilesState,
    savePluginStorageSnapshot,
    savePresetCollection,
    updatePlugin,
    uploadCharacterAvatar,
    uploadChatAttachments,
    uploadPersonaAvatar,
} from "./client";

type DeleteCharacterVariables = {
    characterId: string;
    deleteChats?: boolean;
};

type DeleteChatAttachmentVariables = {
    chatId: string;
    fileName: string;
};

type ExportCharacterCardVariables = {
    characterId: string;
    format: "json" | "png";
};

type ExportLorebookVariables = {
    lorebookId: string;
    format: "json" | "smiley";
};

type SavePluginEnabledVariables = {
    enabled: boolean;
    pluginId: string;
};

type SavePluginStorageSnapshotVariables = {
    pluginId: string;
    storage: Record<string, unknown>;
};

type UploadAvatarVariables = {
    file: File;
    id: string;
};

type UploadChatAttachmentsVariables = {
    chatId: string;
    files: File[];
};

export const mutationKeys = {
    appPreferences: ["app-preferences"] as const,
    characters: {
        create: ["characters", "create"] as const,
        delete: ["characters", "delete"] as const,
        exportCard: ["characters", "export-card"] as const,
        import: ["characters", "import"] as const,
        save: ["characters", "save"] as const,
        saveIndex: ["characters", "save-index"] as const,
        uploadAvatar: ["characters", "upload-avatar"] as const,
    },
    chats: {
        create: ["chats", "create"] as const,
        delete: ["chats", "delete"] as const,
        deleteAttachment: ["chats", "delete-attachment"] as const,
        import: ["chats", "import"] as const,
        save: ["chats", "save"] as const,
        saveIndex: ["chats", "save-index"] as const,
        uploadAttachments: ["chats", "upload-attachments"] as const,
    },
    connections: {
        saveSecrets: ["connections", "save-secrets"] as const,
        saveSettings: ["connections", "save-settings"] as const,
    },
    lorebooks: {
        delete: ["lorebooks", "delete"] as const,
        export: ["lorebooks", "export"] as const,
        import: ["lorebooks", "import"] as const,
        save: ["lorebooks", "save"] as const,
    },
    personas: {
        create: ["personas", "create"] as const,
        delete: ["personas", "delete"] as const,
        save: ["personas", "save"] as const,
        saveIndex: ["personas", "save-index"] as const,
        uploadAvatar: ["personas", "upload-avatar"] as const,
    },
    plugins: {
        deleteProfile: ["plugins", "delete-profile"] as const,
        install: ["plugins", "install"] as const,
        installManualArtifact: ["plugins", "install-manual-artifact"] as const,
        saveEnabled: ["plugins", "save-enabled"] as const,
        saveProfiles: ["plugins", "save-profiles"] as const,
        saveStorage: ["plugins", "save-storage"] as const,
        update: ["plugins", "update"] as const,
    },
    presets: ["presets", "save"] as const,
};

export const mutationStore = {
    createCharacter: mutationOptions({
        mutationKey: mutationKeys.characters.create,
        mutationFn: (character: SmileyCharacter) => createCharacter(character),
    }),
    createChat: mutationOptions({
        mutationKey: mutationKeys.chats.create,
        mutationFn: (chat: ChatSession) => createChat(chat),
    }),
    createPersona: mutationOptions({
        mutationKey: mutationKeys.personas.create,
        mutationFn: (persona: SmileyPersona) => createPersona(persona),
    }),
    deleteCharacter: mutationOptions({
        mutationKey: mutationKeys.characters.delete,
        mutationFn: ({ characterId, deleteChats }: DeleteCharacterVariables) =>
            deleteCharacter(characterId, { deleteChats }),
    }),
    deleteChat: mutationOptions({
        mutationKey: mutationKeys.chats.delete,
        mutationFn: (chatId: string) => deleteChat(chatId),
    }),
    deleteChatAttachment: mutationOptions({
        mutationKey: mutationKeys.chats.deleteAttachment,
        mutationFn: ({ chatId, fileName }: DeleteChatAttachmentVariables) =>
            deleteChatAttachment(chatId, fileName),
    }),
    deleteLorebook: mutationOptions({
        mutationKey: mutationKeys.lorebooks.delete,
        mutationFn: (lorebookId: string) => deleteLorebook(lorebookId),
    }),
    deletePersona: mutationOptions({
        mutationKey: mutationKeys.personas.delete,
        mutationFn: (personaId: string) => deletePersona(personaId),
    }),
    deletePluginProfile: mutationOptions({
        mutationKey: mutationKeys.plugins.deleteProfile,
        mutationFn: (profileId: string) => deletePluginProfile(profileId),
    }),
    exportCharacterCard: mutationOptions({
        mutationKey: mutationKeys.characters.exportCard,
        mutationFn: ({ characterId, format }: ExportCharacterCardVariables) =>
            exportCharacterCard(characterId, format),
    }),
    exportLorebook: mutationOptions({
        mutationKey: mutationKeys.lorebooks.export,
        mutationFn: ({ lorebookId, format }: ExportLorebookVariables) =>
            exportLorebook(lorebookId, format),
    }),
    importCharacterFiles: mutationOptions({
        mutationKey: mutationKeys.characters.import,
        mutationFn: (formData: FormData) => importCharacterFiles(formData),
    }),
    importChatFile: mutationOptions({
        mutationKey: mutationKeys.chats.import,
        mutationFn: (formData: FormData) => importChatFile(formData),
    }),
    importLorebookFiles: mutationOptions({
        mutationKey: mutationKeys.lorebooks.import,
        mutationFn: (formData: FormData) => importLorebookFiles(formData),
    }),
    installManualArtifact: mutationOptions({
        mutationKey: mutationKeys.plugins.installManualArtifact,
        mutationFn: (artifactUrl: string) => installManualArtifact(artifactUrl),
    }),
    installPlugin: mutationOptions({
        mutationKey: mutationKeys.plugins.install,
        mutationFn: (pluginId: string) => installPlugin(pluginId),
    }),
    saveAppPreferences: mutationOptions({
        mutationKey: mutationKeys.appPreferences,
        mutationFn: (preferences: AppPreferences) => saveAppPreferences(preferences),
    }),
    saveCharacter: mutationOptions({
        mutationKey: mutationKeys.characters.save,
        mutationFn: (character: SmileyCharacter) => saveCharacter(character),
    }),
    saveCharacterIndex: mutationOptions({
        mutationKey: mutationKeys.characters.saveIndex,
        mutationFn: (index: CharacterSummaryCollection) => saveCharacterIndex(index),
    }),
    saveChat: mutationOptions({
        mutationKey: mutationKeys.chats.save,
        mutationFn: (chat: ChatSession) => saveChat(chat),
    }),
    saveChatIndex: mutationOptions({
        mutationKey: mutationKeys.chats.saveIndex,
        mutationFn: (chats: ChatSummaryCollection) => saveChatIndex(chats),
    }),
    saveConnectionSecrets: mutationOptions({
        mutationKey: mutationKeys.connections.saveSecrets,
        mutationFn: (secrets: ConnectionSecrets) => saveConnectionSecrets(secrets),
    }),
    saveConnectionSettings: mutationOptions({
        mutationKey: mutationKeys.connections.saveSettings,
        mutationFn: (settings: ConnectionSettings) => saveConnectionSettings(settings),
    }),
    saveLorebook: mutationOptions({
        mutationKey: mutationKeys.lorebooks.save,
        mutationFn: (lorebook: Lorebook) => saveLorebook(lorebook),
    }),
    savePersona: mutationOptions({
        mutationKey: mutationKeys.personas.save,
        mutationFn: (persona: SmileyPersona) => savePersona(persona),
    }),
    savePersonaIndex: mutationOptions({
        mutationKey: mutationKeys.personas.saveIndex,
        mutationFn: (personas: Parameters<typeof savePersonaIndex>[0]) =>
            savePersonaIndex(personas),
    }),
    savePluginEnabled: mutationOptions({
        mutationKey: mutationKeys.plugins.saveEnabled,
        mutationFn: ({ pluginId, enabled }: SavePluginEnabledVariables) =>
            savePluginEnabled(pluginId, enabled),
    }),
    savePluginProfilesState: mutationOptions({
        mutationKey: mutationKeys.plugins.saveProfiles,
        mutationFn: (state: PluginProfilesState) => savePluginProfilesState(state),
    }),
    savePluginStorageSnapshot: mutationOptions({
        mutationKey: mutationKeys.plugins.saveStorage,
        mutationFn: ({ pluginId, storage }: SavePluginStorageSnapshotVariables) =>
            savePluginStorageSnapshot(pluginId, storage),
    }),
    savePresetCollection: mutationOptions({
        mutationKey: mutationKeys.presets,
        mutationFn: (presets: PresetCollection) => savePresetCollection(presets),
    }),
    updatePlugin: mutationOptions({
        mutationKey: mutationKeys.plugins.update,
        mutationFn: (pluginId: string) => updatePlugin(pluginId),
    }),
    uploadCharacterAvatar: mutationOptions({
        mutationKey: mutationKeys.characters.uploadAvatar,
        mutationFn: ({ id, file }: UploadAvatarVariables) =>
            uploadCharacterAvatar(id, file),
    }),
    uploadChatAttachments: mutationOptions({
        mutationKey: mutationKeys.chats.uploadAttachments,
        mutationFn: ({ chatId, files }: UploadChatAttachmentsVariables) =>
            uploadChatAttachments(chatId, files),
    }),
    uploadPersonaAvatar: mutationOptions({
        mutationKey: mutationKeys.personas.uploadAvatar,
        mutationFn: ({ id, file }: UploadAvatarVariables) => uploadPersonaAvatar(id, file),
    }),
};
