<script setup lang="ts">
import { ref } from 'vue'
import JsBarcode from 'jsbarcode'

type BarcodeOptions = NonNullable<Parameters<typeof JsBarcode>[2]>

const equipmentId = ref('')
const lastGenerated = ref('')
const errorMessage = ref('')
const barWidth = ref(3)
const barcodeSvg = ref<SVGSVGElement>()

function barcodeOptions(width: number, scale = 1): BarcodeOptions {
  return {
    format: 'CODE128',
    width: width * scale,
    height: 180 * scale,
    displayValue: true,
    fontSize: 28 * scale,
    fontOptions: 'bold',
    font: 'monospace',
    textAlign: 'center',
    textPosition: 'bottom',
    textMargin: 8,
    margin: 24 * scale,
    background: '#ffffff',
    lineColor: '#000000',
  }
}

function renderBarcode(value: string) {
  if (!barcodeSvg.value) return
  JsBarcode(barcodeSvg.value, value, barcodeOptions(barWidth.value))
}

function generate() {
  const value = equipmentId.value.trim()
  if (!value) {
    errorMessage.value = '請先輸入 Equipment ID'
    lastGenerated.value = ''
    return
  }
  try {
    renderBarcode(value)
    lastGenerated.value = value
    errorMessage.value = ''
  } catch {
    errorMessage.value = '此內容無法用 CODE128 編碼（僅支援 ASCII 字元）'
    lastGenerated.value = ''
  }
}

function onWidthChange() {
  if (lastGenerated.value) renderBarcode(lastGenerated.value)
}

function downloadPng() {
  if (!lastGenerated.value) return
  const canvas = document.createElement('canvas')
  JsBarcode(canvas, lastGenerated.value, barcodeOptions(barWidth.value, 3))
  const url = canvas.toDataURL('image/png')
  const link = document.createElement('a')
  link.href = url
  link.download = `barcode-${lastGenerated.value.replace(/[\\/:*?"<>|]/g, '_')}.png`
  link.click()
}
</script>

<template>
  <div class="page">
    <header class="hero">
      <h1 class="hero-title">
        Barcode Generator
      </h1>
      <p class="hero-subtitle">
        輸入 Equipment ID，即可以 CODE128 格式產生條碼，方便用手機掃描或列印標籤
      </p>
    </header>

    <main class="content">
      <!-- Input -->
      <el-card shadow="never" class="input-card">
        <div class="input-row">
          <el-input
            v-model="equipmentId"
            size="large"
            placeholder="請輸入 Equipment ID，例如：EQP-A001-001"
            clearable
            @keyup.enter="generate"
          />
          <el-button type="primary" size="large" @click="generate">
            產生條碼
          </el-button>
        </div>
        <div class="size-row">
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
        <el-alert
          v-if="errorMessage"
          :title="errorMessage"
          type="error"
          show-icon
          :closable="false"
          class="error-alert"
        />
      </el-card>

      <!-- Result：用 v-show 讓 svg 常駐 DOM，generate() 才能立即拿到 ref 渲染 -->
      <el-card v-show="lastGenerated" shadow="never" class="result-card">
        <template #header>
          <div class="result-header">
            <span>CODE128 條碼</span>
            <el-button type="primary" plain size="default" @click="downloadPng">
              下載 PNG
            </el-button>
          </div>
        </template>
        <div class="barcode-wrapper">
          <svg ref="barcodeSvg" class="barcode-svg" />
        </div>
      </el-card>

      <!-- Empty state -->
      <div v-show="!lastGenerated" class="empty-hint">
        <svg viewBox="0 0 24 24" width="46" height="46" fill="#c0c4cc">
          <path d="M2 4h2v16H2V4zm4 0h1v16H6V4zm3 0h2v16H9V4zm4 0h1v16h-1V4zm3 0h2v16h-2V4zm4 0h1v16h-1V4zM13 4h1v16h-1V4z" />
        </svg>
        <p>產生的條碼會顯示在這裡</p>
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
  padding: 48px 32px 40px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  color: #fff;
  text-align: center;
}

.hero-title {
  font-size: 38px;
  font-weight: 700;
  margin: 0 0 12px;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  font-size: 15px;
  line-height: 1.6;
  opacity: 0.82;
  margin: 0;
}

/* Content */
.content {
  flex: 1;
  width: 100%;
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px 48px;
}

.input-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.input-row {
  display: flex;
  gap: 12px;
}

.input-row .el-input {
  flex: 1;
}

.size-row {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 22px;
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

/* Result */
.result-card {
  margin-top: 24px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #1e293b;
}

.barcode-wrapper {
  background: #ffffff;
  border-radius: 8px;
  display: flex;
  justify-content: center;
  padding: 8px;
}

.barcode-svg {
  max-width: 100%;
  height: auto;
}

/* Empty state */
.empty-hint {
  margin-top: 24px;
  padding: 64px 24px;
  text-align: center;
  color: #94a3b8;
  border: 1px dashed #d3dce6;
  border-radius: 12px;
}

.empty-hint p {
  margin: 12px 0 0;
  font-size: 14px;
}

/* Footer */
.footer {
  padding: 20px;
  text-align: center;
  font-size: 13px;
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
