import type { Update } from '@tauri-apps/plugin-updater'

export const isTauri = Boolean(
  typeof window !== 'undefined' &&
    (window as unknown as Record<string, unknown>).__TAURI_INTERNALS__,
)

export async function getAppVersion(): Promise<string> {
  if (!isTauri) return ''
  try {
    const { getVersion } = await import('@tauri-apps/api/app')
    return await getVersion()
  } catch {
    return ''
  }
}

/** Check for a desktop update. Returns null on mobile / browser / errors / no update. */
export async function checkAppUpdate(): Promise<Update | null> {
  if (!isTauri) return null
  try {
    const { check } = await import('@tauri-apps/plugin-updater')
    return (await check()) ?? null
  } catch {
    return null
  }
}

export async function installAppUpdate(update: Update): Promise<void> {
  await update.downloadAndInstall()
  const { relaunch } = await import('@tauri-apps/plugin-process')
  await relaunch()
}
