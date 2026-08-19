<script setup lang="ts">
import { ref } from 'vue'

interface StackItem {
  name: string
  version: string
  description: string
  docs: string
  icon: string
  color: string
}

const stack = ref<StackItem[]>([
  {
    name: 'Vite 8',
    version: 'v8',
    description: 'Next-gen build tool with instant cold start and lightning-fast HMR.',
    docs: 'https://vite.dev',
    icon: 'vite',
    color: '#646cff',
  },
  {
    name: 'Vue 3',
    version: 'v3.5',
    description: 'Progressive framework with Composition API and <script setup> syntax.',
    docs: 'https://vuejs.org',
    icon: 'vue',
    color: '#42b883',
  },
  {
    name: 'Vue Router',
    version: 'v5',
    description: 'Official routing library, configured with createWebHistory.',
    docs: 'https://router.vuejs.org',
    icon: 'router',
    color: '#42b883',
  },
  {
    name: 'Pinia',
    version: 'v3',
    description: 'Type-safe, intuitive store for application state management.',
    docs: 'https://pinia.vuejs.org',
    icon: 'pinia',
    color: '#ffd859',
  },
  {
    name: 'Pinia Persistedstate',
    version: 'v4',
    description: 'Plugin that persists store state to localStorage automatically.',
    docs: 'https://prazdevs.github.io/pinia-plugin-persistedstate',
    icon: 'persist',
    color: '#ffd859',
  },
  {
    name: 'Element Plus',
    version: 'v2.14',
    description: 'Comprehensive Vue 3 UI library, auto-imported in this template.',
    docs: 'https://element-plus.org',
    icon: 'element',
    color: '#409eff',
  },
  {
    name: 'VueUse',
    version: 'v14',
    description: 'Collection of essential Vue composition utilities. Provide lot of useful tool',
    docs: 'https://vueuse.org',
    icon: 'vueuse',
    color: '#41b883',
  },
  {
    name: 'Vue DevTools',
    version: 'v8',
    description: 'Browser-independent inspector integrated via vite-plugin-vue-devtools.',
    docs: 'https://devtools.vuejs.org',
    icon: 'devtools',
    color: '#41b883',
  },
])

const features = ref([
  {
    title: 'Auto Import',
    description: 'Element Plus components & APIs are auto-imported via unplugin, no manual registration.',
  },
  {
    title: 'TypeScript Ready',
    description: 'Strict TS config with vue-tsc for type-checking across the whole project.',
  },
  {
    title: 'Path Alias',
    description: 'The @ alias points to /src for clean, refactor-friendly imports.',
  },
  {
    title: 'Persistent State',
    description: 'Pinia stores can opt-in to localStorage persistence by setting persist: true.',
  },
])
</script>

<template>
  <div class="home">
    <!-- Hero -->
    <header class="hero">
      <div class="hero-content">
        <div class="hero-badge">
          <span class="badge-dot" />
          Starter Template
        </div>
        <h1 class="hero-title">
          Vue 3 Base Template
        </h1>
        <p class="hero-subtitle">
          A ready-to-use Vue 3 starter scaffolded with Vite 8, pre-configured with the essentials:
          Vue Router, Pinia, Element Plus, VueUse, and more — so you can start building on day one.
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round>
            Start Building
          </el-button>
          <el-button size="large" round @click="$router.push('/')">
            View on GitHub
          </el-button>
        </div>
      </div>
      <div class="hero-glow" />
    </header>

    <!-- Tech stack -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">
          Pre-installed Stack
        </h2>
        <p class="section-desc">
          Everything below is wired up and ready to go. No setup required.
        </p>
      </div>

      <el-row :gutter="20">
        <el-col
          v-for="item in stack"
          :key="item.name"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="6"
        >
          <a
            :href="item.docs"
            target="_blank"
            rel="noopener"
            class="stack-link"
          >
            <el-card shadow="hover" class="stack-card">
              <div class="stack-head">
                <div class="stack-icon" :style="{ color: item.color }">
                  <!-- letter mark to avoid bundling logo assets -->
                  {{ item.name.charAt(0) }}
                </div>
                <div class="stack-meta">
                  <div class="stack-name">
                    {{ item.name }}
                  </div>
                  <el-tag size="small" type="info" effect="plain">
                    {{ item.version }}
                  </el-tag>
                </div>
              </div>
              <p class="stack-desc">
                {{ item.description }}
              </p>
            </el-card>
          </a>
        </el-col>
      </el-row>
    </section>

    <!-- Features -->
    <section class="section">
      <div class="section-header">
        <h2 class="section-title">
          What's Wired Up
        </h2>
        <p class="section-desc">
          Convenience details already configured in this template.
        </p>
      </div>

      <el-row :gutter="20">
        <el-col
          v-for="f in features"
          :key="f.title"
          :xs="24"
          :sm="12"
          :md="6"
        >
          <el-card shadow="never" class="feature-card">
            <div class="feature-bullet">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path d="M5 12l5 5L20 7" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
            </div>
            <h3 class="feature-title">
              {{ f.title }}
            </h3>
            <p class="feature-desc">
              {{ f.description }}
            </p>
          </el-card>
        </el-col>
      </el-row>
    </section>

    <!-- Quick start -->
    <section class="section">
      <el-card shadow="never" class="terminal-card">
        <div class="terminal-head">
          <span class="terminal-title">Quick Start</span>
          <div class="terminal-dots">
            <span class="dot red" />
            <span class="dot yellow" />
            <span class="dot green" />
          </div>
        </div>
        <pre class="terminal-body"><code><span class="c-comment"># install dependencies</span>
<span class="c-prompt">$</span> pnpm install

<span class="c-comment"># start the dev server</span>
<span class="c-prompt">$</span> pnpm dev

<span class="c-comment"># type-check &amp; build for production</span>
<span class="c-prompt">$</span> pnpm build</code></pre>
      </el-card>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <span>Vue 3 Base Template</span>
      <span class="footer-dot">•</span>
      <span>Vite 8 + Element Plus</span>
    </footer>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: #f5f7fa;
  padding-bottom: 48px;
}

/* Hero */
.hero {
  position: relative;
  padding: 72px 48px 64px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%);
  color: #fff;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 760px;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.3px;
  backdrop-filter: blur(8px);
}

.badge-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #42b883;
  box-shadow: 0 0 8px #42b883;
}

.hero-title {
  font-size: 48px;
  font-weight: 700;
  margin: 20px 0 14px;
  line-height: 1.12;
  letter-spacing: -0.5px;
}

.hero-subtitle {
  font-size: 17px;
  line-height: 1.6;
  opacity: 0.82;
  margin: 0 0 32px;
  max-width: 620px;
}

.hero-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.hero-glow {
  position: absolute;
  top: -160px;
  right: -160px;
  width: 480px;
  height: 480px;
  background: radial-gradient(circle, rgba(66, 184, 131, 0.28) 0%, transparent 70%);
  border-radius: 50%;
  pointer-events: none;
}

/* Sections */
.section {
  padding: 40px 48px 0;
}

.section-header {
  margin-bottom: 24px;
}

.section-title {
  font-size: 24px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px;
}

.section-desc {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

/* Stack cards */
.stack-link {
  text-decoration: none;
  display: block;
  margin-bottom: 20px;
}

.stack-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  height: 100%;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.stack-card:hover {
  transform: translateY(-3px);
  border-color: #cbd5e1;
}

.stack-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.stack-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
}

.stack-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stack-name {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.stack-desc {
  font-size: 13px;
  line-height: 1.55;
  color: #64748b;
  margin: 0;
}

/* Feature cards */
.feature-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  text-align: left;
  margin-bottom: 20px;
}

.feature-bullet {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #ecfdf5;
  color: #10b981;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.feature-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 6px;
}

.feature-desc {
  font-size: 13px;
  line-height: 1.55;
  color: #64748b;
  margin: 0;
}

/* Terminal */
.terminal-card {
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #0f172a;
}

.terminal-card :deep(.el-card__body) {
  padding: 0;
}

.terminal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 18px;
  border-bottom: 1px solid #1e293b;
}

.terminal-title {
  font-size: 13px;
  font-weight: 600;
  color: #94a3b8;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.terminal-dots {
  display: flex;
  gap: 7px;
}

.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.dot.red { background: #ef4444; }
.dot.yellow { background: #f59e0b; }
.dot.green { background: #10b981; }

.terminal-body {
  margin: 0;
  padding: 20px 22px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, "Cascadia Code", monospace;
  font-size: 13.5px;
  line-height: 1.9;
  color: #e2e8f0;
  overflow-x: auto;
}

.c-comment { color: #64748b; }
.c-prompt { color: #42b883; font-weight: 600; }

/* Footer */
.footer {
  margin-top: 56px;
  padding: 24px 48px;
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
    padding: 48px 24px 56px;
  }

  .hero-title {
    font-size: 34px;
  }

  .section {
    padding: 32px 24px 0;
  }

  .footer {
    padding: 24px;
    flex-direction: column;
    gap: 4px;
  }
}
</style>