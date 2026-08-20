<script setup lang="ts">
import { reactive, ref } from 'vue'
import JsBarcode from 'jsbarcode'

type BarcodeOptions = NonNullable<Parameters<typeof JsBarcode>[2]>

interface BarcodeItem {
  id: number
  equipmentId: string
  lastGenerated: string
  errorMessage: string
}

let nextId = 1

function createItem(): BarcodeItem {
  return { id: nextId++, equipmentId: '', lastGenerated: '', errorMessage: '' }
}

const items = reactive<BarcodeItem[]>([createItem()])
const barWidth = ref(3)
const svgRefs = new Map<number, SVGSVGElement>()

function setSvgRef(id: number, el: Element | null) {
  if (el) svgRefs.set(id, el as SVGSVGElement)
  else svgRefs.delete(id)
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

function renderBarcode(item: BarcodeItem) {
  const svg = svgRefs.get(item.id)
  if (!svg) return
  JsBarcode(svg, item.lastGenerated, barcodeOptions(barWidth.value))
}

function generate(item: BarcodeItem) {
  const value = item.equipmentId.trim()
  if (!value) {
    item.errorMessage = '請先輸入 Equipment ID'
    item.lastGenerated = ''
    return
  }
  item.lastGenerated = value
  try {
    renderBarcode(item)
    item.errorMessage = ''
  } catch {
    item.errorMessage = '此內容無法用 CODE128 編碼（僅支援 ASCII 字元）'
    item.lastGenerated = ''
  }
}

function onWidthChange() {
  for (const item of items) {
    if (item.lastGenerated) renderBarcode(item)
  }
}

function downloadPng(item: BarcodeItem) {
  if (!item.lastGenerated) return
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, item.lastGenerated, barcodeOptions(barWidth.value, 3))
  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = url
  link.download = `barcode-${item.lastGenerated.replace(/[\\/:*?"<>|]/g, '_')}.png`
  link.click()
}

function addItem() {
  items.push(createItem())
}

function removeItem(item: BarcodeItem) {
  if (items.length <= 1) return
  const index = items.indexOf(item)
  if (index !== -1) items.splice(index, 1)
  svgRefs.delete(item.id)
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">
        Barcode Generator
      </h1>
    </header>

    <main class="content">
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

      <div v-for="(item, index) in items" :key="item.id" class="barcode-group">
        <!-- Input -->
        <el-card shadow="never" class="input-card">
          <div class="input-row">
            <el-input
              v-model="item.equipmentId"
              size="large"
              placeholder="請輸入 Equipment ID，例如：EQP-A001-001"
              clearable
              @keyup.enter="generate(item)"
            />
            <el-button type="primary" size="large" @click="generate(item)">
              產生條碼
            </el-button>
            <el-button
              circle
              size="large"
              class="remove-btn"
              :disabled="items.length <= 1"
              @click="removeItem(item)"
            >
              −
            </el-button>
            <el-button
              v-if="index === items.length - 1"
              circle
              size="large"
              type="primary"
              plain
              class="add-btn"
              @click="addItem"
            >
              +
            </el-button>
          </div>
          <el-alert
            v-if="item.errorMessage"
            :title="item.errorMessage"
            type="error"
            show-icon
            :closable="false"
            class="error-alert"
          />
        </el-card>

        <!-- Result：用 v-show 讓 svg 常駐 DOM，generate() 才能立即拿到 ref 渲染 -->
        <el-card v-show="item.lastGenerated" shadow="never" class="result-card">
          <template #header>
            <div class="result-header">
              <span>CODE128 條碼</span>
              <el-button type="primary" plain size="small" @click="downloadPng(item)">
                下載 PNG
              </el-button>
            </div>
          </template>
          <div class="barcode-wrapper">
            <svg :ref="(el) => setSvgRef(item.id, el as Element | null)" class="barcode-svg" />
          </div>
        </el-card>

        <!-- Empty state -->
        <div v-show="!item.lastGenerated" class="empty-hint">
          <svg viewBox="0 0 24 24" width="46" height="46" fill="#c0c4cc">
            <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zM13 4h1v16h-1V4z" />
          </svg>
          <p>產生的條碼會顯示在這裡</p>
        </div>
      </div>
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

/* Content */
.content {
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 16px 24px 24px;
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

.error-alert {
  margin-top: 16px;
}

.barcode-group {
  margin-bottom: 14px;
}

.barcode-group:last-child {
  margin-bottom: 0;
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
@media (max-width: 768px) {
  .hero {
    padding: 36px 20px 32px;
  }

  .hero-title {
    font-size: 28px;
  }

  .content {
    padding: 24px 16px 40px;
  }

  .input-row {
    flex-direction: column;
  }
}
</style>
