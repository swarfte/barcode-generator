<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { useNow } from '@vueuse/core'
import { ElMessageBox } from 'element-plus'
import JsBarcode from 'jsbarcode'
import { useBarcodeStore } from '@/store'
import type { Profile, Record } from '@/model'

type BarcodeOptions = NonNullable<Parameters<typeof JsBarcode>[2]>

interface RecordRuntime {
  lastGenerated: string
  errorMessage: string
}

const store = useBarcodeStore()
store.ensureDefaults()

const barWidth = ref(3)

const activeProfile = computed(() => store.activeProfile)
const activeRecords = computed(() => store.activeProfile?.records ?? [])

const now = useNow({ interval: 30_000 })

/* ---------- 側邊欄（Notion 風格目錄） ---------- */

const expanded = reactive(new Set<string>([store.activeProfileId]))
const editingProfileId = ref('')
const editingName = ref('')
const renameInput = ref<{ focus: () => void } | null>(null)

function isExpanded(profileId: string) {
  return expanded.has(profileId)
}

function toggleExpand(profileId: string) {
  if (expanded.has(profileId)) expanded.delete(profileId)
  else expanded.add(profileId)
}

function switchProfile(profileId: string) {
  store.switchProfile(profileId)
  expanded.add(profileId)
}

async function addProfile() {
  const profile = store.createProfile()
  expanded.add(profile.id)
  await startRename(profile)
}

async function startRename(profile: Profile) {
  editingProfileId.value = profile.id
  editingName.value = profile.name
  await nextTick()
  renameInput.value?.focus()
}

function commitRename() {
  const profileId = editingProfileId.value
  if (!profileId) return
  editingProfileId.value = ''
  store.renameProfile(profileId, editingName.value)
}

async function confirmDelete(message: string) {
  try {
    await ElMessageBox.confirm(message, '刪除確認', {
      type: 'warning',
      confirmButtonText: '刪除',
      cancelButtonText: '取消',
    })
    return true
  } catch {
    return false
  }
}

async function removeProfile(profileId: string) {
  const profile = store.profiles.find((item) => item.id === profileId)
  if (!profile) return
  const hasData = profile.records.some((record) => record.code.trim())
  const message = hasData
    ? `確定刪除設定檔「${profile.name}」？內含 ${profile.records.length} 筆記錄，刪除後無法復原。`
    : `確定刪除設定檔「${profile.name}」？`
  if (!(await confirmDelete(message))) return
  if (editingProfileId.value === profileId) editingProfileId.value = ''
  expanded.delete(profileId)
  for (const record of profile.records) {
    runtimeMap.delete(record.id)
    svgRefs.delete(record.id)
  }
  store.deleteProfile(profileId)
}

async function addRecordTo(profileId: string) {
  if (store.activeProfileId !== profileId) store.switchProfile(profileId)
  const record = store.createRecord(profileId)
  if (!record) return
  expanded.add(profileId)
  await nextTick()
  scrollToRecord(record.id)
  document.getElementById(`record-${record.id}`)?.querySelector('input')?.focus()
}

async function switchRecord(profileId: string, recordId: string) {
  if (store.activeProfileId !== profileId) {
    store.switchProfile(profileId)
    expanded.add(profileId)
  }
  store.switchRecord(recordId)
  await nextTick()
  scrollToRecord(recordId)
}

function scrollToRecord(recordId: string) {
  document.getElementById(`record-${recordId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
}

async function removeRecord(record: Record) {
  const code = record.code.trim()
  if (code && !(await confirmDelete(`確定刪除記錄「${code}」？`))) return
  runtimeMap.delete(record.id)
  svgRefs.delete(record.id)
  store.deleteRecord(record.id)
}

function formatRelativeTime(timestamp: number) {
  if (!timestamp) return '尚未更新'
  const diff = now.value.getTime() - timestamp
  if (diff < 60_000) return '剛剛更新'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes} 分鐘前更新`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小時前更新`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前更新`
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}/${pad(date.getMonth() + 1)}/${pad(date.getDate())} 更新`
}

/* ---------- 條碼產生（runtime 狀態不持久化；產生條碼不影響 lastUpdated） ---------- */

const runtimeMap = reactive(new Map<string, RecordRuntime>())
const svgRefs = new Map<string, SVGSVGElement>()

function getRuntime(recordId: string): RecordRuntime {
  let runtime = runtimeMap.get(recordId)
  if (!runtime) {
    runtime = { lastGenerated: '', errorMessage: '' }
    runtimeMap.set(recordId, runtime)
  }
  return runtime
}

function setSvgRef(recordId: string, el: Element | null) {
  if (el) svgRefs.set(recordId, el as SVGSVGElement)
  else svgRefs.delete(recordId)
}

function barcodeOptions(width: number, scale = 1): BarcodeOptions {
  return {
    format: 'CODE128',
    width: width * scale,
    height: 90 * scale,
    displayValue: true,
    fontSize: 18 * scale,
    fontOptions: 'bold',
    font: 'monospace',
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 6,
    margin: 10 * scale,
    background: '#ffffff',
    lineColor: '#000000',
  }
}

function renderBarcode(recordId: string, value: string) {
  const svg = svgRefs.get(recordId)
  if (!svg || !value) return
  JsBarcode(svg, value, barcodeOptions(barWidth.value))
}

function generate(record: Record) {
  const runtime = getRuntime(record.id)
  const value = record.code.trim()
  if (!value) {
    runtime.errorMessage = '請先輸入 Equipment ID'
    runtime.lastGenerated = ''
    return
  }
  runtime.lastGenerated = value
  try {
    renderBarcode(record.id, value)
    runtime.errorMessage = ''
  } catch {
    runtime.errorMessage = '此內容無法用 CODE128 編碼（僅支援 ASCII 字元）'
    runtime.lastGenerated = ''
  }
}

function onWidthChange() {
  for (const record of activeRecords.value) {
    const runtime = runtimeMap.get(record.id)
    if (runtime?.lastGenerated) renderBarcode(record.id, runtime.lastGenerated)
  }
}

function downloadPng(record: Record) {
  const value = runtimeMap.get(record.id)?.lastGenerated
  if (!value) return
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, value, barcodeOptions(barWidth.value, 3))
  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = url
  link.download = `barcode-${value.replace(/[\\/:*?"<>|]/g, '_')}.png`
  link.click()
}

// 切換設定檔後 v-for 會重建 <svg>，需把已產生的條碼重新渲染到新的元素上
watch(
  () => store.activeProfileId,
  async () => {
    await nextTick()
    for (const record of activeRecords.value) {
      const runtime = runtimeMap.get(record.id)
      if (runtime?.lastGenerated) renderBarcode(record.id, runtime.lastGenerated)
    }
  },
)
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">
        Barcode Generator
      </h1>
    </header>

    <main class="layout">
      <!-- 左欄：設定檔目錄（Notion 風格） -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <span class="sidebar-title">設定檔</span>
          <button class="icon-btn" title="新增設定檔" @click="addProfile">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>

        <div class="sidebar-body">
          <div v-for="profile in store.profiles" :key="profile.id" class="profile-group">
            <div
              class="profile-row"
              :class="{ active: profile.id === store.activeProfileId }"
              @click="switchProfile(profile.id)"
            >
              <button
                class="chevron"
                :class="{ expanded: isExpanded(profile.id) }"
                title="展開 / 收合"
                @click.stop="toggleExpand(profile.id)"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="m9 6 6 6-6 6" />
                </svg>
              </button>

              <el-input
                v-if="editingProfileId === profile.id"
                ref="renameInput"
                v-model="editingName"
                size="small"
                class="rename-input"
                @keyup.enter="commitRename"
                @blur="commitRename"
                @click.stop
              />
              <template v-else>
                <span class="profile-name" title="雙擊重新命名" @dblclick.stop="startRename(profile)">
                  {{ profile.name }}
                </span>
                <span class="profile-count">{{ profile.records.length }}</span>
                <span class="row-actions" @click.stop>
                  <button class="icon-btn" title="新增記錄" @click="addRecordTo(profile.id)">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </button>
                  <button class="icon-btn danger" title="刪除設定檔" @click="removeProfile(profile.id)">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    </svg>
                  </button>
                </span>
              </template>
            </div>

            <div v-show="isExpanded(profile.id)" class="record-list">
              <div
                v-for="(record, index) in profile.records"
                :key="record.id"
                class="record-row"
                :class="{ active: record.id === store.activeRecordId && profile.id === store.activeProfileId }"
                @click="switchRecord(profile.id, record.id)"
              >
                <svg class="record-icon" viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                  <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zM13 4h1v16h-1V4z" />
                </svg>
                <div class="record-info">
                  <span class="record-name">{{ record.code || `記錄 ${index + 1}` }}</span>
                  <span class="record-time">{{ formatRelativeTime(record.lastUpdated) }}</span>
                </div>
                <button class="icon-btn record-delete" title="刪除記錄" @click.stop="removeRecord(record)">
                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右欄：目前設定檔的條碼產生器 -->
      <section class="workspace">
        <div class="workspace-meta">
          <span class="profile-chip">{{ activeProfile?.name }}</span>
          <span class="record-count">{{ activeRecords.length }} 個記錄</span>
        </div>

        <div class="size-row global-size-row">
          <span class="size-label">條碼大小</span>
          <el-slider
            v-model="barWidth"
            :min="2"
            :max="6"
            :step="1"
            :marks="{ 2: 'S', 3: 'M', 4: 'L', 5: 'XL', 6: 'XXL' }"
            show-stops
            class="size-slider"
            @change="onWidthChange"
          />
        </div>

        <div
          v-for="(record, index) in activeRecords"
          :id="`record-${record.id}`"
          :key="record.id"
          class="barcode-group"
          :class="{ 'is-active': record.id === store.activeRecordId }"
        >
          <!-- Input -->
          <el-card shadow="never" class="input-card">
            <div class="input-row">
              <el-input
                :model-value="record.code"
                size="large"
                placeholder="請輸入 Equipment ID，例如：EQP-A001-001"
                clearable
                @update:model-value="(value: string) => store.setCode(record.id, value)"
                @keyup.enter="generate(record)"
              />
              <el-button type="primary" size="large" @click="generate(record)">
                產生條碼
              </el-button>
              <el-button circle size="large" class="remove-btn" title="刪除記錄" @click="removeRecord(record)">
                −
              </el-button>
              <el-button
                v-if="index === activeRecords.length - 1"
                circle
                size="large"
                type="primary"
                plain
                class="add-btn"
                @click="addRecordTo(store.activeProfileId)"
              >
                +
              </el-button>
            </div>
            <el-alert
              v-if="getRuntime(record.id).errorMessage"
              :title="getRuntime(record.id).errorMessage"
              type="error"
              show-icon
              :closable="false"
              class="error-alert"
            />
          </el-card>

          <!-- Result：用 v-show 讓 svg 常駐 DOM，generate() 才能立即拿到 ref 渲染 -->
          <el-card v-show="getRuntime(record.id).lastGenerated" shadow="never" class="result-card">
            <template #header>
              <div class="result-header">
                <span>CODE128 條碼</span>
                <el-button type="primary" plain size="small" @click="downloadPng(record)">
                  下載 PNG
                </el-button>
              </div>
            </template>
            <div class="barcode-wrapper">
              <svg :ref="(el) => setSvgRef(record.id, el as Element | null)" class="barcode-svg" />
            </div>
          </el-card>

          <!-- Empty state -->
          <div v-show="!getRuntime(record.id).lastGenerated" class="empty-hint">
            <svg viewBox="0 0 24 24" width="46" height="46" fill="#c0c4cc">
              <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zM13 4h1v16h-1V4z" />
            </svg>
            <p>產生的條碼會顯示在這裡</p>
          </div>
        </div>
      </section>
    </main>

    <footer class="footer">
      <span>Barcode Generator</span>
      <span class="footer-dot">•</span>
      <span>CODE128</span>
    </footer>
  </div>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  flex-direction: column;
}

/* Hero */
.hero {
  padding: 14px 32px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  color: #fff;
  text-align: center;
}

.hero-title {
  font-size: 20px;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}

/* 兩欄版面：設定檔目錄 (2) : 條碼產生器 (8) */
.layout {
  flex: 1;
  width: 100%;
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px 24px;
  display: grid;
  grid-template-columns: 2fr 8fr;
  gap: 16px;
  align-items: start;
}

/* ---------- 左欄：Sidebar ---------- */
.sidebar {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  position: sticky;
  top: 16px;
  max-height: calc(100vh - 96px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 6px;
}

.sidebar-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 2px;
}

.sidebar-body {
  overflow-y: auto;
  padding: 2px 8px 12px;
}

.profile-group {
  margin-bottom: 2px;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #1e293b;
  font-size: 14px;
  font-weight: 600;
}

.profile-row:hover {
  background: #f1f5f9;
}

.profile-row.active {
  background: #e8f1ff;
  color: #1d4ed8;
}

.chevron {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  flex-shrink: 0;
}

.chevron svg {
  transition: transform 0.15s;
}

.chevron.expanded svg {
  transform: rotate(90deg);
}

.chevron:hover {
  background: rgba(15, 23, 42, 0.08);
}

.rename-input {
  flex: 1;
  min-width: 0;
}

.profile-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-count {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 400;
  color: #94a3b8;
  background: #f1f5f9;
  border-radius: 10px;
  padding: 0 7px;
  line-height: 18px;
}

.profile-row.active .profile-count {
  background: #d6e4ff;
  color: #1d4ed8;
}

.row-actions {
  display: none;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.profile-row:hover .row-actions {
  display: inline-flex;
}

.profile-row:hover .profile-count {
  display: none;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  flex-shrink: 0;
}

.icon-btn:hover {
  background: rgba(15, 23, 42, 0.08);
  color: #1e293b;
}

.icon-btn.danger:hover {
  color: #ef4444;
}

.record-list {
  padding-left: 14px;
}

.record-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #475569;
}

.record-row:hover {
  background: #f1f5f9;
}

.record-row.active {
  background: #eef2ff;
  color: #1e293b;
}

.record-icon {
  flex-shrink: 0;
  color: #94a3b8;
}

.record-row.active .record-icon {
  color: #6366f1;
}

.record-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.record-name {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.record-time {
  font-size: 11px;
  color: #94a3b8;
}

.record-delete {
  display: none;
}

.record-row:hover .record-delete {
  display: inline-flex;
}

/* ---------- 右欄：Workspace ---------- */
.workspace {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.workspace-meta {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 12px;
}

.profile-chip {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
}

.record-count {
  font-size: 12px;
  color: #94a3b8;
}

.size-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.global-size-row {
  margin-bottom: 12px;
  padding: 10px 20px;
  background: #ffffff;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.size-label {
  font-size: 14px;
  color: #64748b;
  white-space: nowrap;
}

.size-slider {
  flex: 1;
}

.input-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.input-card :deep(.el-card__body) {
  padding: 12px 16px;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-row .el-input {
  flex: 1;
}

.remove-btn,
.add-btn {
  flex-shrink: 0;
  font-size: 20px;
  font-weight: 600;
}

.error-alert {
  margin-top: 16px;
}

.barcode-group {
  margin-bottom: 14px;
  padding: 2px;
  border-radius: 14px;
  transition: box-shadow 0.25s;
}

.barcode-group:last-child {
  margin-bottom: 0;
}

/* 側邊欄點選的記錄會以柔光標示對應區塊 */
.barcode-group.is-active {
  box-shadow: 0 0 0 2px #bfdbfe;
}

/* Result */
.result-card {
  margin-top: 12px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.result-card :deep(.el-card__header) {
  padding: 8px 16px;
}

.result-card :deep(.el-card__body) {
  padding: 8px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 13px;
  color: #1e293b;
}

.barcode-wrapper {
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  padding: 4px;
}

.barcode-svg {
  max-width: 100%;
  max-height: 140px;
  height: auto;
}

/* Empty state */
.empty-hint {
  margin-top: 12px;
  padding: 24px 24px;
  text-align: center;
  color: #94a3b8;
  border: 1px dashed #d3dce6;
  border-radius: 12px;
}

.empty-hint p {
  margin: 8px 0 0;
  font-size: 13px;
}

.empty-hint svg {
  width: 28px;
  height: 28px;
}

/* Footer */
.footer {
  padding: 10px;
  text-align: center;
  font-size: 12px;
  color: #94a3b8;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.footer-dot {
  opacity: 0.5;
}

/* Responsive */
@media (max-width: 900px) {
  .layout {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .sidebar {
    position: static;
    max-height: 40vh;
  }
}

@media (max-width: 768px) {
  .hero {
    padding: 12px 16px;
  }

  .layout {
    padding: 12px 12px 20px;
  }

  .input-row {
    flex-direction: column;
  }
}
</style>
