import { defineStore } from 'pinia'
import type { Profile, Record } from './model'

const DEFAULT_PROFILE_NAME = 'Default Profile'

function newRecord(code = ''): Record {
  return {
    id: crypto.randomUUID(),
    code,
    lastUpdated: Date.now(),
  }
}

function newProfile(name: string): Profile {
  return {
    id: crypto.randomUUID(),
    name,
    records: [newRecord()],
  }
}

/** Local-time timestamp formatted as yyyyMMddHHmmss (e.g. 20260827140430), used as the default name for new profiles */
function timestampName(): string {
  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  )
}

export const useBarcodeStore = defineStore('barcode', {
  // On first use a default profile with one empty record is created; afterwards persistedstate restores from localStorage
  state: () => {
    const profile = newProfile(DEFAULT_PROFILE_NAME)
    return {
      profiles: [profile],
      activeProfileId: profile.id,
      activeRecordId: profile.records[0].id,
    }
  },

  getters: {
    activeProfile(state): Profile | undefined {
      return state.profiles.find((profile) => profile.id === state.activeProfileId)
    },
    activeRecord(): Record | undefined {
      return this.activeProfile?.records.find((record) => record.id === this.activeRecordId)
    },
  },

  actions: {
    /** Repair invalid state possibly restored from localStorage (no profiles, stale active ids, empty records) */
    ensureDefaults() {
      if (this.profiles.length === 0) {
        const profile = newProfile(DEFAULT_PROFILE_NAME)
        this.profiles.push(profile)
        this.activeProfileId = profile.id
        this.activeRecordId = profile.records[0].id
        return
      }
      if (!this.profiles.some((profile) => profile.id === this.activeProfileId)) {
        this.activeProfileId = this.profiles[0].id
      }
      const profile = this.profiles.find((item) => item.id === this.activeProfileId)
      if (!profile) return
      if (profile.records.length === 0) {
        const record = newRecord()
        profile.records.push(record)
        this.activeRecordId = record.id
        return
      }
      if (!profile.records.some((record) => record.id === this.activeRecordId)) {
        this.activeRecordId = profile.records[0].id
      }
    },

    switchProfile(profileId: string) {
      const profile = this.profiles.find((item) => item.id === profileId)
      if (!profile || profile.id === this.activeProfileId) return
      this.activeProfileId = profile.id
      this.activeRecordId = profile.records[0]?.id ?? ''
    },

    createProfile(name?: string) {
      const profile = newProfile(name?.trim() || timestampName())
      this.profiles.push(profile)
      this.activeProfileId = profile.id
      this.activeRecordId = profile.records[0].id
      return profile
    },

    renameProfile(profileId: string, name: string) {
      const profile = this.profiles.find((item) => item.id === profileId)
      const trimmed = name.trim()
      if (profile && trimmed) profile.name = trimmed
    },

    deleteProfile(profileId: string) {
      const index = this.profiles.findIndex((item) => item.id === profileId)
      if (index === -1) return
      this.profiles.splice(index, 1)
      if (this.profiles.length === 0) {
        // Keep at least one profile to maintain the "always a default profile" invariant
        const profile = newProfile(DEFAULT_PROFILE_NAME)
        this.profiles.push(profile)
        this.activeProfileId = profile.id
        this.activeRecordId = profile.records[0].id
        return
      }
      if (this.activeProfileId === profileId) {
        const next = this.profiles[Math.min(index, this.profiles.length - 1)]
        this.activeProfileId = next.id
        this.activeRecordId = next.records[0]?.id ?? ''
      }
    },

    switchRecord(recordId: string) {
      const record = this.activeProfile?.records.find((item) => item.id === recordId)
      if (record) this.activeRecordId = record.id
    },

    createRecord(profileId?: string) {
      const targetId = profileId ?? this.activeProfileId
      const profile = this.profiles.find((item) => item.id === targetId)
      if (!profile) return undefined
      const record = newRecord()
      profile.records.push(record)
      if (targetId === this.activeProfileId) this.activeRecordId = record.id
      return record
    },

    deleteRecord(recordId: string) {
      for (const profile of this.profiles) {
        const index = profile.records.findIndex((item) => item.id === recordId)
        if (index === -1) continue
        profile.records.splice(index, 1)
        const isActiveProfile = profile.id === this.activeProfileId
        if (profile.records.length === 0) {
          // Keep at least one (empty) record per profile
          const record = newRecord()
          profile.records.push(record)
          if (isActiveProfile) this.activeRecordId = record.id
        } else if (isActiveProfile && this.activeRecordId === recordId) {
          this.activeRecordId = profile.records[Math.min(index, profile.records.length - 1)].id
        }
        return
      }
    },

    /** Only touch lastUpdated when the code actually changes (barcode generation bypasses this, so it never affects the update time) */
    setCode(recordId: string, code: string) {
      for (const profile of this.profiles) {
        const record = profile.records.find((item) => item.id === recordId)
        if (!record) continue
        if (record.code !== code) {
          record.code = code
          record.lastUpdated = Date.now()
        }
        return
      }
    },
  },

  persist: true,
})
