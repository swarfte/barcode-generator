import { defineStore } from 'pinia'
import type { Profile, Record } from './model'

const DEFAULT_PROFILE_NAME = '預設設定檔'

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

export const useBarcodeStore = defineStore('barcode', {
  // 首次使用時自動產生「一個預設設定檔 + 一筆空白記錄」；之後由 persistedstate 從 localStorage 還原
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
    /** 修復 localStorage 還原後可能出現的無效狀態（空 profiles、失效的 active id、空 records） */
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
      const profile = newProfile(name?.trim() || `設定檔 ${this.profiles.length + 1}`)
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
        // 至少保留一個設定檔，符合「預設產生一個設定檔」的不變量
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
          // 每個設定檔至少保留一筆（空白）記錄
          const record = newRecord()
          profile.records.push(record)
          if (isActiveProfile) this.activeRecordId = record.id
        } else if (isActiveProfile && this.activeRecordId === recordId) {
          this.activeRecordId = profile.records[Math.min(index, profile.records.length - 1)].id
        }
        return
      }
    },

    /** 只有 code 真的改變時才更新 lastUpdated（產生條碼不經過這裡，不會影響更新時間） */
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
