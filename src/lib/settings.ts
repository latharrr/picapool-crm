import { settingsRepository } from "@/lib/sheets/repositories";
import type { FeatureKey } from "@/lib/nav-config";

const FEATURE_PREFIX = "features.";
const ALL_FEATURE_KEYS: FeatureKey[] = [
  "calling",
  "housing",
  "campaigns",
  "messages",
  "analytics",
  "tasks",
];

export type FeatureFlags = Record<FeatureKey, boolean>;

function defaultFlags(): FeatureFlags {
  return {
    calling: true,
    housing: true,
    campaigns: true,
    messages: true,
    analytics: true,
    tasks: true,
  };
}

export async function getFeatureFlags(spreadsheetId: string): Promise<FeatureFlags> {
  const settings = await settingsRepository.list(spreadsheetId);
  const flags = defaultFlags();

  for (const setting of settings) {
    if (!setting.key.startsWith(FEATURE_PREFIX)) continue;
    const key = setting.key.slice(FEATURE_PREFIX.length) as FeatureKey;
    if (ALL_FEATURE_KEYS.includes(key)) {
      flags[key] = setting.value === "true";
    }
  }

  return flags;
}

export async function setFeatureFlag(
  spreadsheetId: string,
  feature: FeatureKey,
  enabled: boolean,
  updatedBy: string
): Promise<void> {
  const key = `${FEATURE_PREFIX}${feature}`;
  const settings = await settingsRepository.list(spreadsheetId);
  const existing = settings.find((s) => s.key === key);

  if (existing) {
    await settingsRepository.update(spreadsheetId, existing.id, { value: String(enabled) }, updatedBy);
  } else {
    await settingsRepository.create(spreadsheetId, {
      key,
      value: String(enabled),
      created_by: updatedBy,
    });
  }
}

export { ALL_FEATURE_KEYS };
