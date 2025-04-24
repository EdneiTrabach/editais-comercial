# 🧩 Prompt para Refatoração Modular, Padronizada e Escalável em Vue.js

## 🎯 Objetivo

Executar uma refatoração completa e estratégica em projetos Vue.js, priorizando:

- ✅ Modularidade e reutilização
- ✅ Estrutura de pastas padronizada
- ✅ Clareza e manutenibilidade do código
- ✅ Responsividade e suporte a temas (claro/escuro)
- ✅ Separação de responsabilidades (UI, lógica, estilo)

---

## 📍 Etapas da Refatoração

### **1. Diagnóstico Inicial**

**Analise o componente atual e identifique:**

- 🔹 *Componentes candidatos à separação*:

  - Botões de ação
  - Tabelas customizadas
  - Modais e formulários reutilizáveis
  - Elementos de UI repetidos

- 🔹 *Funções duplicadas ou genéricas*:

  - Formatadores (datas, moedas, CPF/CNPJ)
  - Validadores reutilizáveis
  - Funções de fetch

- 🔹 *Estilos misturados e mal organizados*:

  - CSS inline ou acoplado ao `.vue`
  - Falta de variáveis temáticas

- 🔹 *Arquivos com múltiplas responsabilidades*:

  - Componentes misturando lógica e visual
  - Serviços com funções não relacionadas

---

### **2. Estrutura Modular por Funcionalidade**

Organize cada módulo da seguinte forma:

```bash
views/
└── NomeModulo/
    ├── NomeModuloView.vue        # Componente principal
    ├── css/
    │   └── nome-modulo.css       # Estilos isolados e temáticos
    ├── functions/
    │   ├── formatadores.js
    │   └── validadores.js
    ├── composables/
    │   └── useNomeModuloStore.js
    ├── components/
    │   ├── ItemTable.vue
    │   ├── ItemForm.vue
    │   ├── ItemDeleteDialog.vue
    │   └── CustomCell.vue
    └── index.js                  # Exportações do módulo
```

---

### **3. Lógica em Composables e Funções Puras**

```js
// composables/useNomeModuloStore.js
import { ref } from 'vue'

export function useNomeModuloStore() {
  const items = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchItems = async () => {
    isLoading.value = true
    try {
      items.value = await apiCall()
    } catch (err) {
      error.value = err.message
    } finally {
      isLoading.value = false
    }
  }

  return { items, isLoading, error, fetchItems }
}
```

---

### **4. CSS Modular com Suporte a Temas e Responsividade**

```css
/* nome-modulo.css */
.container {
  background-color: var(--bg-content, #fff);
  color: var(--text-primary, #333);
}

[data-theme="dark"] .container {
  background-color: var(--bg-content-dark);
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
```

---

### **5. Componentes Pequenos, Isolados e Reutilizáveis**

```vue
<!-- CustomCell.vue -->
<template>
  <div class="custom-cell">
    <div class="indicator" :style="indicatorStyle"></div>
    <span>{{ formattedValue }}</span>
  </div>
</template>

<script>
export default {
  props: { value: [String, Number] },
  computed: {
    indicatorStyle() { /* ... */ },
    formattedValue() { /* ... */ }
  }
}
</script>
```

---

### **6. Componente Principal: Apenas Estrutura e Integração**

```vue
<!-- NomeModuloView.vue -->
<template>
  <div class="layout">
    <h1>Título do Módulo</h1>
    <ItemTable :items="items" @edit="editarItem" @delete="confirmarExclusao" />
    <ItemForm v-if="showModal" :formData="formData" @submit="salvarItem" />
    <ItemDeleteDialog v-if="showDeleteDialog" :item="itemToDelete" @confirm="excluirItem" />
  </div>
</template>

<script>
import { useNomeModuloStore } from './composables/useNomeModuloStore'

export default {
  setup() {
    const { items, fetchItems } = useNomeModuloStore()
    return { items, fetchItems }
  }
}
</script>

<style src="./css/nome-modulo.css"></style>
```

---

## ✅ Lista de Verificação Final

-

---

## 💡 Melhores Práticas

### ✨ **Nomenclatura**

- Componentes: `PascalCase`
- Composables: `camelCase`
- Estilos: `kebab-case`

### ♻️ **Reutilização e Consistência**

- Props bem definidas + validação
- Eventos claros e documentados (`@submit`, `@change`, etc.)
- Estilos integrados ao sistema do projeto

### 🌗 **Temas e Acessibilidade**

- Variáveis CSS para cores/tamanhos
- Suporte total a tema escuro
- Contraste e UX acessível

### 📱 **Responsividade Moderna**

- Mobile-first
- Breakpoints claros
- Grid e Flex Layouts

### ⚙️ **Performance**

- Lazy loading de componentes grandes
- Paginação em grandes listas
- Computeds memoizados

