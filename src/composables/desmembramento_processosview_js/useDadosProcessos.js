import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'

export function useDadosProcessos() {
  const processos = ref([])
  const loading = ref(false)
  const isLoading = ref(false)
  const loadingTimeout = ref(null)
  const anoSelecionado = ref(new Date().getFullYear())
  
  // Computed properties
  const anosDisponiveis = computed(() => {
    const anos = new Set(processos.value.map(p => new Date(p.data_pregao).getFullYear()))
    return Array.from(anos).sort((a, b) => b - a) // Ordem decrescente
  })
  
  const loadProcessos = async () => {
    if (isLoading.value) return;

    try {
      isLoading.value = true;

      const { data, error } = await supabase
        .from('processos')
        .select('*')
        .order('data_pregao', { ascending: false });

      if (error) throw error;

      // Atualiza processos
      processos.value = data;

      // Atualiza anos disponíveis considerando a data do pregão
      const anos = new Set(data.map(p => new Date(p.data_pregao).getFullYear()));
      
      // Verifica se o ano selecionado ainda existe
      if (!anos.has(anoSelecionado.value) && anos.size > 0) {
        const anoMaisRecente = Math.max(...anos);
        anoSelecionado.value = anoMaisRecente;
      }

    } catch (error) {
      console.error('Erro ao carregar processos:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  const selecionarAno = (ano) => {
    anoSelecionado.value = ano
  }
  
  return {
    processos,
    loading,
    isLoading,
    loadProcessos,
    anoSelecionado,
    anosDisponiveis,
    selecionarAno
  }
}