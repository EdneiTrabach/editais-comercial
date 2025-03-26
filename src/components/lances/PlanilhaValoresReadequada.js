import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { usePlanilha } from '@/composables/usePlanilha'

export default {
  setup() {
    const router = useRouter()
    const { formatarMoeda } = usePlanilha()

    // Estados
    const percentualAjuste = ref('') // Mudamos para string para aceitar o sinal
    const itensReadequados = ref([])
    const totalOriginal = ref(0)
    const valorEstimado = ref(0)

    // Computed para percentual formatado
    const percentualFormatado = computed(() => {
      const valor = percentualAjuste.value.replace(/[^0-9,\-+]/g, '')
      return valor ? parseFloat(valor.replace(',', '.')) : 0
    })

    // Computed para total readequado
    const totalReadequado = computed(() => {
      const percentual = percentualFormatado.value
      // Se positivo, aumenta; se negativo, diminui
      return totalOriginal.value * (1 + (percentual / 100))
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

    // Handler para mudança no percentual
    const handlePercentualChange = (event) => {
      let valor = event.target.value
      
      // Limpa tudo exceto números, vírgula e sinais
      valor = valor.replace(/[^0-9,\-+]/g, '')
      
      // Garante apenas um sinal no início
      if (valor.length > 0) {
        const temSinal = valor[0] === '+' || valor[0] === '-'
        const numeroLimpo = valor.replace(/[\-+]/g, '')
        valor = (temSinal ? valor[0] : '') + numeroLimpo
      }
      
      percentualAjuste.value = valor
      calcularReadequacao()
    }

    const calcularReadequacao = () => {
      const percentual = percentualFormatado.value
      // Fator será maior que 1 para aumento e menor que 1 para desconto
      const fator = 1 + (percentual / 100)

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
      percentualAjuste,
      percentualFormatado,
      itensReadequados,
      totalOriginal,
      valorEstimado,
      totalReadequado,
      formatarMoeda,
      handlePercentualChange,
      calcularReadequacao,
      aplicarReadequacao,
      voltarPlanilha
    }
  }
}