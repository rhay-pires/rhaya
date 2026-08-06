import { supabase, isSupabaseConfigured } from './supabase'

const LOCAL_KEY = 'lifehub_db_v1'

export function loadLocalDb() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveLocalDb(db) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(db))
  } catch {
    /* quota / private mode */
  }
}

/** Pull cloud snapshot for the signed-in user. Returns null if none. */
export async function pullCloudDb(userId) {
  if (!isSupabaseConfigured || !supabase || !userId) return null
  const { data, error } = await supabase
    .from('lifehub_snapshots')
    .select('data, updated_at')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Upsert full LifeHub JSON for the signed-in user. */
export async function pushCloudDb(userId, db) {
  if (!isSupabaseConfigured || !supabase || !userId || !db) return
  const { error } = await supabase.from('lifehub_snapshots').upsert(
    {
      user_id: userId,
      data: db,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) throw error
}

/**
 * After login: prefer cloud if it exists; otherwise upload local/current db.
 * Returns the db that should be shown in the UI.
 */
export async function hydrateFromCloud(userId, currentDb) {
  const remote = await pullCloudDb(userId)
  if (remote?.data && typeof remote.data === 'object') {
    saveLocalDb(remote.data)
    return { db: remote.data, source: 'cloud' }
  }
  await pushCloudDb(userId, currentDb)
  return { db: currentDb, source: 'local-upload' }
}
