import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query";
import { useEffect, useMemo, useState } from "preact/hooks";

import { mergeCoreAndUserPluginManifests } from "#frontend/core-extensions";
import { type PluginRegistryEntry } from "#frontend/lib/api/client";
import { mutationStore } from "#frontend/lib/api/mutation-options";
import { queryKeys, queryStore } from "#frontend/lib/api/query-options";
import { messageFromError } from "#frontend/lib/common/errors";
import {
    applyProfileToPlugins,
    snapshotAllPluginConfigs,
} from "#frontend/lib/plugins/activation";
import {
    BUILT_IN_PROFILES,
    DEFAULT_PROFILE_ID,
    isStateCustom,
    type PluginProfile,
    type PluginProfilesState,
} from "#frontend/lib/plugins/profiles";
import {
    deactivatePlugin,
    getLoadedPlugins,
    getPluginSettingsPanels,
    setPluginEnabledState,
    subscribeToPluginRegistry,
} from "#frontend/lib/plugins/registry";
import { loadCoreRuntimePlugin, loadRuntimePlugin } from "#frontend/lib/plugins/runtime";
import {
    PLUGIN_CATEGORIES,
    PLUGIN_CATEGORY_LABELS,
    type PluginCategory,
    type PluginManifest,
} from "#frontend/lib/plugins/types";

import {
    type InstalledFilter,
    nextProfileName,
    type PluginsView,
    uniqueProfileId,
} from "./plugin-settings-helpers";

export function usePluginSettings() {
    const queryClient = useQueryClient();
    const pluginManifestsQuery = useQuery(queryStore.pluginManifests);
    const pluginProfilesQuery = useQuery(queryStore.pluginProfiles);
    const pluginRegistryQuery = useQuery(queryStore.pluginRegistry);
    const deletePluginProfileMutation = useMutation(mutationStore.deletePluginProfile);
    const installManualArtifactMutation = useMutation(
        mutationStore.installManualArtifact,
    );
    const installPluginMutation = useMutation(mutationStore.installPlugin);
    const savePluginEnabledMutation = useMutation(mutationStore.savePluginEnabled);
    const savePluginProfilesStateMutation = useMutation(
        mutationStore.savePluginProfilesState,
    );
    const updatePluginMutation = useMutation(mutationStore.updatePlugin);
    const [statusMessage, setStatusMessage] = useState("");
    const [statusKind, setStatusKind] = useState<"success" | "error">("success");
    const [openPluginId, setOpenPluginId] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [installedFilter, setInstalledFilter] = useState<InstalledFilter>("all");
    const [categoryFilter, setCategoryFilter] = useState<PluginCategory | "all">("all");
    const [activeView, setActiveView] = useState<PluginsView>("local");
    const [manualArtifactUrl, setManualArtifactUrl] = useState("");
    const [installingPluginId, setInstallingPluginId] = useState("");
    const [updatingPluginId, setUpdatingPluginId] = useState("");
    const [manualInstallBusy, setManualInstallBusy] = useState(false);

    const [, setRegistryRevision] = useState(0);
    const loadedPlugins = getLoadedPlugins();
    const pluginSettingsPanels = getPluginSettingsPanels();

    const plugins = useMemo(
        () => mergeCoreAndUserPluginManifests(pluginManifestsQuery.data?.plugins ?? []),
        [pluginManifestsQuery.data?.plugins],
    );

    const profilesPayload = pluginProfilesQuery.data ?? null;
    const manualArtifactAllowed =
        !pluginRegistryQuery.isError &&
        pluginRegistryQuery.data?.allowManualArtifactInstall === true;
    const isMutationPending =
        deletePluginProfileMutation.isPending ||
        installManualArtifactMutation.isPending ||
        installPluginMutation.isPending ||
        savePluginEnabledMutation.isPending ||
        savePluginProfilesStateMutation.isPending ||
        updatePluginMutation.isPending;

    const isBusy =
        pluginManifestsQuery.isFetching ||
        pluginProfilesQuery.isFetching ||
        pluginRegistryQuery.isFetching ||
        isMutationPending ||
        manualInstallBusy;

    useEffect(
        () =>
            subscribeToPluginRegistry(() =>
                setRegistryRevision((revision) => revision + 1),
            ),
        [],
    );

    const currentEnabledMap = useMemo(() => {
        const map: Record<string, boolean> = {};
        for (const plugin of plugins) {
            map[plugin.id] = plugin.enabled !== false;
        }
        return map;
    }, [plugins]);

    const allProfiles = useMemo<PluginProfile[]>(() => {
        const builtins = profilesPayload?.builtinProfiles ?? BUILT_IN_PROFILES;
        const userProfiles = profilesPayload?.userProfiles ?? [];
        return [...builtins, ...userProfiles];
    }, [profilesPayload]);

    const activeProfileId = profilesPayload?.activeProfileId ?? DEFAULT_PROFILE_ID;
    const activeProfile =
        allProfiles.find((profile) => profile.id === activeProfileId) ?? allProfiles[0];
    const isCustom = profilesPayload
        ? isStateCustom(currentEnabledMap, profilesPayload.lastApplied)
        : false;

    const filteredPlugins = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        return plugins.filter((plugin) => {
            const category = plugin.category ?? "other";
            const enabled = plugin.enabled !== false;

            if (categoryFilter !== "all" && category !== categoryFilter) {
                return false;
            }

            if (installedFilter === "installed" && !enabled) {
                return false;
            }

            if (installedFilter === "not-installed" && enabled) {
                return false;
            }

            if (search) {
                const haystack = [
                    plugin.name,
                    plugin.id,
                    plugin.description ?? "",
                    PLUGIN_CATEGORY_LABELS[category],
                ]
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(search)) {
                    return false;
                }
            }

            return true;
        });
    }, [plugins, searchTerm, installedFilter, categoryFilter]);

    const groupedPlugins = useMemo(() => {
        const groups = new Map<PluginCategory, PluginManifest[]>();
        for (const plugin of filteredPlugins) {
            const category = plugin.category ?? "other";
            const bucket = groups.get(category) ?? [];
            bucket.push(plugin);
            groups.set(category, bucket);
        }
        return PLUGIN_CATEGORIES.filter((category) => groups.has(category)).map(
            (category) => [category, groups.get(category) ?? []] as const,
        );
    }, [filteredPlugins]);

    const categoryCounts = useMemo(() => {
        const counts = new Map<PluginCategory, number>();
        for (const plugin of plugins) {
            const category = plugin.category ?? "other";
            counts.set(category, (counts.get(category) ?? 0) + 1);
        }
        return counts;
    }, [plugins]);

    const localPluginIds = useMemo(
        () => new Set(plugins.map((plugin) => plugin.id)),
        [plugins],
    );

    const registryStatusById = useMemo(() => {
        const map = new Map<string, PluginRegistryEntry["status"]>();
        if (pluginRegistryQuery.isError) {
            return map;
        }
        for (const plugin of pluginRegistryQuery.data?.plugins ?? []) {
            map.set(plugin.id, plugin.status);
        }
        return map;
    }, [pluginRegistryQuery.data?.plugins, pluginRegistryQuery.isError]);

    const filteredRegistryPlugins = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();
        return (pluginRegistryQuery.data?.plugins ?? []).filter((plugin) => {
            const installed = localPluginIds.has(plugin.id);

            if (categoryFilter !== "all" && plugin.category !== categoryFilter) {
                return false;
            }

            if (installedFilter === "installed" && !installed) {
                return false;
            }

            if (installedFilter === "not-installed" && installed) {
                return false;
            }

            if (search) {
                const haystack = [
                    plugin.name,
                    plugin.id,
                    plugin.description ?? "",
                    plugin.author ?? "",
                    PLUGIN_CATEGORY_LABELS[plugin.category],
                ]
                    .join(" ")
                    .toLowerCase();

                if (!haystack.includes(search)) {
                    return false;
                }
            }

            return true;
        });
    }, [
        categoryFilter,
        installedFilter,
        localPluginIds,
        pluginRegistryQuery.data?.plugins,
        searchTerm,
    ]);

    const registryCategoryCounts = useMemo(() => {
        const counts = new Map<PluginCategory, number>();
        for (const plugin of pluginRegistryQuery.data?.plugins ?? []) {
            counts.set(plugin.category, (counts.get(plugin.category) ?? 0) + 1);
        }
        return counts;
    }, [pluginRegistryQuery.data?.plugins]);

    async function refreshAll() {
        try {
            const [manifestResponse, profilesResponse] = await Promise.all([
                pluginManifestsQuery.refetch(),
                pluginProfilesQuery.refetch(),
            ]);

            if (manifestResponse.error) {
                throw manifestResponse.error;
            }
            if (profilesResponse.error) {
                throw profilesResponse.error;
            }

            void refreshRegistry(false);
            setStatusMessage("");
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not load plugins."));
            setStatusKind("error");
        }
    }

    async function refreshRegistry(showStatus = true) {
        try {
            const registryResponse = await pluginRegistryQuery.refetch();
            if (registryResponse.error) {
                throw registryResponse.error;
            }
        } catch (error) {
            if (showStatus) {
                setStatusMessage(
                    messageFromError(error, "Could not load extension registry."),
                );
                setStatusKind("error");
            }
        }
    }

    async function togglePlugin(plugin: PluginManifest) {
        if (isBusy) return;

        const nextEnabled = plugin.enabled === false;
        const enablingUnverified =
            nextEnabled &&
            plugin.source !== "core" &&
            plugin.install?.source !== "registry" &&
            !registryStatusById.has(plugin.id);

        try {
            const response = await savePluginEnabledMutation.mutateAsync({
                pluginId: plugin.id,
                enabled: nextEnabled,
            });
            setPluginEnabledState(plugin.id, nextEnabled);

            if (plugin.source === "core") {
                if (nextEnabled) {
                    await loadCoreRuntimePlugin(plugin.id);
                } else {
                    deactivatePlugin(plugin.id);
                }
            } else if (nextEnabled) {
                const nextPlugin =
                    response.plugins?.find((item) => item.id === plugin.id) ??
                    response.plugin;
                if (nextPlugin) {
                    await loadRuntimePlugin(nextPlugin);
                }
            } else {
                deactivatePlugin(plugin.id);
            }
            await queryClient.invalidateQueries({
                queryKey: queryKeys.plugins.manifests,
            });

            setStatusMessage(
                `${plugin.name} ${nextEnabled ? "enabled" : "disabled"}.${
                    enablingUnverified
                        ? " This plugin is unverified; keep it enabled only if you completely trust the author."
                        : plugin.source === "core" ||
                            nextEnabled ||
                            loadedPlugins.find((item) => item.manifest.id === plugin.id)
                          ? ""
                          : " Restart SmileyChat to load this plugin into the current session."
                }`,
            );
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not update plugin."));
            setStatusKind("error");
        }
    }

    async function installStorePlugin(plugin: PluginRegistryEntry) {
        if (isBusy) {
            return;
        }

        setInstallingPluginId(plugin.id);

        try {
            await installAndApplyEnabled(plugin.id, true, () =>
                installPluginMutation.mutateAsync(plugin.id),
            );
            setStatusMessage(`${plugin.name} installed and enabled.`);
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not install extension."));
            setStatusKind("error");
        } finally {
            setInstallingPluginId("");
        }
    }

    async function updateStorePlugin(plugin: PluginRegistryEntry) {
        if (isBusy) return;

        const installedPlugin = plugins.find((item) => item.id === plugin.id);
        if (!installedPlugin) return;

        setUpdatingPluginId(plugin.id);
        try {
            const shouldRemainEnabled = installedPlugin.enabled !== false;
            const updatedPlugin = await installAndApplyEnabled(
                plugin.id,
                shouldRemainEnabled,
                // Store updates intentionally resolve the current registry artifact.
                // The managed update endpoint preserves the installed source, which is
                // correct for Local Plugins but wrong for replacing a manual artifact
                // with the verified Store entry of the same ID.
                () => installPluginMutation.mutateAsync(plugin.id),
            );
            setStatusMessage(
                `${updatedPlugin.name} updated from the Extension Store${
                    shouldRemainEnabled ? " and enabled" : ""
                }.`,
            );
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not update extension."));
            setStatusKind("error");
        } finally {
            setUpdatingPluginId("");
        }
    }

    async function installManualPlugin() {
        if (isBusy) return;

        const artifactUrl = manualArtifactUrl.trim();
        if (!artifactUrl) {
            setStatusMessage("Enter an HTTPS ZIP artifact URL.");
            setStatusKind("error");
            return;
        }

        setManualInstallBusy(true);
        try {
            const installedPlugin = await installAndApplyEnabled("", true, () =>
                installManualArtifactMutation.mutateAsync(artifactUrl),
            );
            setManualArtifactUrl("");
            setStatusMessage(
                `${installedPlugin.name} installed from a manual artifact and enabled. Keep it enabled only if you trust the source.`,
            );
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(
                messageFromError(error, "Could not install manual artifact."),
            );
            setStatusKind("error");
        } finally {
            setManualInstallBusy(false);
        }
    }

    async function updateManagedPlugin(plugin: PluginManifest) {
        if (!plugin.install || isBusy) {
            return;
        }

        setUpdatingPluginId(plugin.id);

        try {
            const shouldRemainEnabled = plugin.enabled !== false;
            const updatedPlugin = await installAndApplyEnabled(
                plugin.id,
                shouldRemainEnabled,
                () => updatePluginMutation.mutateAsync(plugin.id),
            );
            setStatusMessage(
                `${updatedPlugin.name} updated${
                    shouldRemainEnabled ? " and enabled" : ""
                }.`,
            );
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not update plugin."));
            setStatusKind("error");
        } finally {
            setUpdatingPluginId("");
        }
    }

    async function installAndApplyEnabled(
        requestedPluginId: string,
        enabled: boolean,
        installRequest: () => Promise<{
            ok: true;
            plugin: PluginManifest;
            plugins: PluginManifest[];
        }>,
    ) {
        const installResponse = await installRequest();
        let installedPlugin = installResponse.plugin;
        const pluginId = requestedPluginId || installedPlugin.id;
        let nextPlugins = installResponse.plugins;

        if ((installedPlugin.enabled !== false) !== enabled) {
            const enableResponse = await savePluginEnabledMutation.mutateAsync({
                pluginId,
                enabled,
            });
            installedPlugin = enableResponse.plugins?.find(
                (item) => item.id === pluginId,
            ) ??
                enableResponse.plugin ?? { ...installedPlugin, enabled };
            nextPlugins = enableResponse.plugins ?? nextPlugins;
        }

        setPluginEnabledState(pluginId, enabled);

        if (enabled) {
            await loadRuntimePlugin({ ...installedPlugin, enabled: true });
        } else {
            deactivatePlugin(pluginId);
        }
        await queryClient.invalidateQueries({ queryKey: queryKeys.plugins.manifests });

        return { ...installedPlugin, enabled };
    }

    async function applyProfile(profile: PluginProfile) {
        if (!profilesPayload) return;

        try {
            const { appliedEnabled, enabledChanges, configChanges } =
                await applyProfileToPlugins(profile, plugins);
            const refreshed = await pluginManifestsQuery.refetch();
            if (refreshed.error) {
                throw refreshed.error;
            }

            const nextState: PluginProfilesState = {
                version: 1,
                activeProfileId: profile.id,
                lastApplied: appliedEnabled,
                userProfiles: profilesPayload.userProfiles,
            };

            await savePluginProfilesStateMutation.mutateAsync(nextState);
            await queryClient.invalidateQueries({ queryKey: queryKeys.plugins.profiles });

            const summary =
                enabledChanges.length === 0 && configChanges.length === 0
                    ? `${profile.name} applied. No plugins needed to change.`
                    : `${profile.name} applied. ${enabledChanges.length} toggled, ${configChanges.length} config${configChanges.length === 1 ? "" : "s"} restored.`;
            setStatusMessage(summary);
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not apply profile."));
            setStatusKind("error");
        }
    }

    async function createNewProfile() {
        if (!profilesPayload) return;
        const name = nextProfileName("Plugin profile", allProfiles);
        const id = uniqueProfileId(name, allProfiles);

        try {
            const pluginConfig = await snapshotAllPluginConfigs(plugins);
            const newProfile: PluginProfile = {
                id,
                name,
                description: "User-defined profile.",
                builtin: false,
                enabledPlugins: { ...currentEnabledMap },
                pluginConfig,
                defaultEnabled: true,
            };

            const nextState: PluginProfilesState = {
                version: 1,
                activeProfileId: id,
                lastApplied: { ...currentEnabledMap },
                userProfiles: [
                    ...profilesPayload.userProfiles.filter(
                        (profile) => profile.id !== id,
                    ),
                    newProfile,
                ],
            };
            await savePluginProfilesStateMutation.mutateAsync(nextState);
            await queryClient.invalidateQueries({ queryKey: queryKeys.plugins.profiles });

            setStatusMessage(`Created "${name}" from the current plugin state.`);
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not create profile."));
            setStatusKind("error");
        }
    }

    async function duplicateActiveProfile() {
        if (!profilesPayload || !activeProfile) return;
        const name = nextProfileName(`${activeProfile.name} Copy`, allProfiles);
        const id = uniqueProfileId(name, allProfiles);

        try {
            const duplicated: PluginProfile = {
                ...activeProfile,
                id,
                name,
                builtin: false,
                description: activeProfile.description || "User-defined profile.",
                enabledPlugins: { ...activeProfile.enabledPlugins },
                pluginConfig: activeProfile.pluginConfig
                    ? structuredClone(activeProfile.pluginConfig)
                    : undefined,
            };
            const nextState: PluginProfilesState = {
                version: 1,
                activeProfileId: id,
                lastApplied: { ...profilesPayload.lastApplied },
                userProfiles: [...profilesPayload.userProfiles, duplicated],
            };
            await savePluginProfilesStateMutation.mutateAsync(nextState);
            await queryClient.invalidateQueries({ queryKey: queryKeys.plugins.profiles });

            setStatusMessage(`Duplicated "${activeProfile.name}" as "${name}".`);
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not duplicate profile."));
            setStatusKind("error");
        }
    }

    async function deleteActiveProfile() {
        if (!profilesPayload || !activeProfile || activeProfile.builtin) return;

        try {
            await deletePluginProfileMutation.mutateAsync(activeProfile.id);
            await queryClient.invalidateQueries({ queryKey: queryKeys.plugins.profiles });

            setStatusMessage(`Deleted "${activeProfile.name}". Active profile reset.`);
            setStatusKind("success");
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not delete profile."));
            setStatusKind("error");
        }
    }

    async function updateActiveProfileDetails(details: {
        description: string;
        name: string;
    }) {
        if (!profilesPayload || !activeProfile || activeProfile.builtin) {
            return false;
        }

        const name = details.name.trim();
        const description = details.description.trim();

        if (!name) {
            setStatusMessage("Profile name cannot be empty.");
            setStatusKind("error");
            return false;
        }

        const nameTaken = allProfiles.some(
            (profile) =>
                profile.id !== activeProfile.id &&
                profile.name.trim().toLowerCase() === name.toLowerCase(),
        );

        if (nameTaken) {
            setStatusMessage(`A profile named "${name}" already exists.`);
            setStatusKind("error");
            return false;
        }

        try {
            const nextState: PluginProfilesState = {
                version: 1,
                activeProfileId: profilesPayload.activeProfileId,
                lastApplied: profilesPayload.lastApplied,
                userProfiles: profilesPayload.userProfiles.map((profile) =>
                    profile.id === activeProfile.id
                        ? {
                              ...profile,
                              name,
                              description: description || undefined,
                          }
                        : profile,
                ),
            };
            await savePluginProfilesStateMutation.mutateAsync(nextState);
            await queryClient.invalidateQueries({ queryKey: queryKeys.plugins.profiles });

            setStatusMessage(`Updated "${name}".`);
            setStatusKind("success");
            return true;
        } catch (error) {
            setStatusMessage(messageFromError(error, "Could not update profile."));
            setStatusKind("error");
            return false;
        }
    }

    return {
        activeProfile,
        activeView,
        allProfiles,
        applyProfile,
        categoryCounts,
        categoryFilter,
        createNewProfile,
        deleteActiveProfile,
        duplicateActiveProfile,
        filteredPlugins,
        filteredRegistryPlugins,
        groupedPlugins,
        installedFilter,
        installingPluginId,
        installStorePlugin,
        updateStorePlugin,
        installManualPlugin,
        isCustom,
        isBusy,
        loadedPlugins,
        localPluginIds,
        manualArtifactAllowed,
        manualArtifactUrl,
        manualInstallBusy,
        openPluginId,
        pluginRegistryQuery,
        plugins,
        refreshAll,
        refreshRegistry,
        registryCategoryCounts,
        registryStatusById,
        searchTerm,
        setActiveView,
        setCategoryFilter,
        setInstalledFilter,
        setManualArtifactUrl,
        setOpenPluginId,
        setSearchTerm,
        pluginSettingsPanels,
        statusKind,
        statusMessage,
        togglePlugin,
        updatingPluginId,
        updateManagedPlugin,
        updateActiveProfileDetails,
    };
}
