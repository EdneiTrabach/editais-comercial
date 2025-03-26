import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanilha } from '@/composables/usePlanilha'

export default {
  setup() {
    const router = useRouter()
    const { formatarMoeda } = usePlanilha()

    // Estados
    const percentualDesconto = ref(0)
    const itensReadequados = ref([])
    const totalOriginal = ref(0)
    const valorEstimado = ref(0)

    // Computed
    const totalReadequado = computed(() => {
      return totalOriginal.value * (1 - (percentualDesconto.value / 100))
    })

    // Carregar dados iniciais
    onMounted(() => {
      const query = router.currentRoute.value.query
      if (query.itens) {
        const itensOriginais = JSON.parse(decodeURIComponent(query.itens))
        itensReadequados.value = itensOriginais.map(item => ({
          ...item,
          valorUnitarioOriginal: item.valorUnitario,
          totalOriginal: item.total
        }))
        totalOriginal.value = parseFloat(query.totalGeral || 0)
        valorEstimado.value = parseFloat(query.valorEstimado || 0)
      }
    })

    const calcularReadequacao = () => {
      const fator = 1 - (percentualDesconto.value / 100)
      itensReadequados.value = itensReadequados.value.map(item => ({
        ...item,
        valorUnitarioOriginal: item.valorUnitarioOriginal || item.valorUnitario,
        valorUnitario: Number((item.valorUnitarioOriginal * fator).toFixed(2)),
        total: Number((item.valorUnitarioOriginal * fator * item.quantidade).toFixed(2))
      }))
    }

    const aplicarReadequacao = () => {
      router.push({
        name: 'PlanilhaValores',
        params: {
          itensAtualizados: itensReadequados.value
        }
      })
    }

    const voltarPlanilha = () => {
      router.back()
    }

    return {
      percentualDesconto,
      itensReadequados,
      totalOriginal,
      valorEstimado,
      totalReadequado,
      formatarMoeda,
      calcularReadequacao,
      aplicarReadequacao,
      voltarPlanilha
    }
  }
}