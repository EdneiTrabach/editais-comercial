import { ref } from 'vue'

export function useGerenciadorTabela() {
  const colunasWidth = ref({})
  const rowsHeight = ref({})
  const selectedRow = ref(null)

  const startColumnResize = (event, campo) => {
    event.preventDefault()
    const th = event.target.closest('th')
    const startWidth = th.offsetWidth
    const startX = event.pageX

    const handleMouseMove = (e) => {
      const dx = e.pageX - startX
      const newWidth = Math.max(80, startWidth + dx)
      colunasWidth.value[campo] = `${newWidth}px`
      th.style.width = `${newWidth}px`
      document.body.style.cursor = 'col-resize'
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      saveColumnWidths()
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const startRowResize = (event, id) => {
    event.preventDefault()
    const tr = event.target.closest('tr')
    const startHeight = tr.offsetHeight
    const startY = event.pageY

    const handleMouseMove = (e) => {
      const dy = e.pageY - startY
      const newHeight = Math.max(40, startHeight + dy)
      rowsHeight.value[id] = `${newHeight}px`
      tr.style.height = `${newHeight}px`
      document.body.style.cursor = 'row-resize'
    }

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const loadColumnWidths = () => {
    try {
      const savedWidths = localStorage.getItem('table-columns-width')
      if (savedWidths) {
        colunasWidth.value = JSON.parse(savedWidths)
      }
    } catch (error) {
      console.error('Erro ao carregar larguras das colunas:', error)
    }
  }

  const saveColumnWidths = () => {
    try {
      localStorage.setItem('table-columns-width', JSON.stringify(colunasWidth.value))
    } catch (error) {
      console.error('Erro ao salvar larguras das colunas:', error)
    }
  }

  const selectRow = (id) => {
    selectedRow.value = id
  }

  return {
    colunasWidth,
    rowsHeight,
    selectedRow,
    startColumnResize,
    startRowResize,
    loadColumnWidths,
    saveColumnWidths,
    selectRow
  }
}