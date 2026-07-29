import type { PluginConfigFieldKind } from '@/types/pluginForms';

interface PluginConfigFieldIdOptions {
  kind: PluginConfigFieldKind;
  key: string;
  occurrence?: number;
}

function encodePluginConfigKey(key: string): string {
  return (
    Array.from(key)
      .map((character) => character.codePointAt(0)!.toString(16))
      .join('-') || 'empty'
  );
}

export function getPluginConfigFieldId({
  kind,
  key,
  occurrence = 0,
}: PluginConfigFieldIdOptions): string {
  const baseId = `plugin-config-${kind.toLowerCase()}-${encodePluginConfigKey(key)}`;
  return occurrence > 0 ? `${baseId}--${occurrence + 1}` : baseId;
}
