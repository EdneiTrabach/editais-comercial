/**
 * Módulo para exportação de relatórios de análise de conformidade em diversos formatos
 */
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import {
  formatDate,
  formatPercent,
  formatSystemStatus,
  gerarCabecalho,
  gerarRodape,
  truncateText,
} from "./formatUtils";
import {
  calcularPercentualGeralAtendimento,
  validarConformidadeSistema,
  validarConformidadeGeral,
} from "./validateCompliance";
import { gerarRecomendacao } from "./generateRecommendation";

/**
 * Exporta análise para TXT no formato especificado
 * @param {Array} sistemas - Lista de sistemas analisados
 * @param {Object} processo - Dados do processo
 * @param {Object} parametros - Parâmetros de análise (percentuais mínimos)
 */
export const exportToTXT = (sistemas, processo, parametros) => {
  if (!sistemas || sistemas.length === 0) {
    alert("Sem dados para exportar");
    return;
  }

  const { percentualMinimoGeral, percentualMinimoObrigatorio } = parametros;

  // Validar conformidade geral
  const resultadoConformidade = validarConformidadeGeral(
    sistemas,
    percentualMinimoGeral,
    percentualMinimoObrigatorio
  );

  // Calcular totais
  const totalItens = sistemas.reduce(
    (acc, sistema) => acc + (sistema.totalItens || 0),
    0
  );
  const totalNaoAtendidos = sistemas.reduce(
    (acc, sistema) => acc + (sistema.naoAtendidos || 0),
    0
  );
  const totalAtendidos = totalItens - totalNaoAtendidos;
  const percentualGeralAtendimento =
    calcularPercentualGeralAtendimento(sistemas);

  // Gerar cabeçalho
  let content = gerarCabecalho(processo, parametros);

  // Verificar se há sistemas analisados
  const sistemasAnalisados = sistemas.filter(
    (s) =>
      s.naoAtendidos !== undefined &&
      s.naoAtendidos !== null &&
      s.naoAtendidos !== "" &&
      s.naoAtendidos !== 0
  );

  // Gerar resumo da análise
  content += "RESUMO DA ANÁLISE\n";
  content += "----------------\n";

  if (sistemasAnalisados.length === 0) {
    content += "Nenhum sistema foi analisado completamente.\n";
    content += "Status Geral: Não Analisado\n\n";
  } else {
    content += `Total de Itens Avaliados: ${totalItens}\n`;
    content += `Itens Atendidos: ${totalAtendidos}\n`;
    content += `Itens Não Atendidos: ${totalNaoAtendidos}\n`;
    content += `Percentual Geral de Atendimento: ${formatPercent(
      percentualGeralAtendimento
    )}\n`;
    content += `Status Geral: ${
      resultadoConformidade.atendePercentualMinimo
        ? "✅ Atende ao percentual mínimo geral"
        : "❌ Não atende ao percentual mínimo geral"
    } (≥ ${percentualMinimoGeral}%)\n\n`;
  }

  // Gerar detalhes dos sistemas
  content += "DETALHES DOS SISTEMAS\n";
  content += "--------------------\n";

  sistemas.forEach((sistema) => {
    const nome = sistema.nome || sistema.sistemas?.nome || "Sistema sem nome";
    const total = sistema.totalItens || 0;

    // Verificar se o sistema foi analisado - considerar 0 como não analisado
    const naoAtendidos =
      sistema.naoAtendidos !== undefined &&
      sistema.naoAtendidos !== null &&
      sistema.naoAtendidos !== 0 &&
      sistema.naoAtendidos !== ""
        ? sistema.naoAtendidos
        : "";

    const hasValidNaoAtendidos = naoAtendidos !== "";

    // Calcular valores apenas se tiver sido analisado
    const atendidos = hasValidNaoAtendidos ? total - naoAtendidos : "";

    content += `Sistema: ${nome}\n`;
    content += `  Total de Itens: ${total}\n`;
    content += `  Atendidos: ${
      atendidos !== "" ? atendidos : "Não analisado"
    }\n`;
    content += `  Não Atendidos: ${
      naoAtendidos !== "" ? naoAtendidos : "Não analisado"
    }\n`;

    if (hasValidNaoAtendidos) {
      const percentualAtendimento = ((total - naoAtendidos) / total) * 100;
      content += `  Percentual: ${formatPercent(percentualAtendimento)}\n`;

      // Status baseado na validação
      const validacao = validarConformidadeSistema(
        sistema,
        percentualMinimoObrigatorio,
        percentualMinimoGeral
      );
      content += `  Status: ${
        validacao.atende
          ? "✅ Atende"
          : `❌ Não Atende (Min: ${validacao.percentualMinimo}%)`
      }\n\n`;
    } else {
      content += `  Percentual: Não analisado\n`;
      content += `  Status: ⚠️ NÃO ANALISADO\n\n`;
    }
  });

  // Resumo dos sistemas
  content += "RESUMO DOS SISTEMAS\n";
  content += "-------------------\n";

  sistemas.forEach((sistema) => {
    const validacao = validarConformidadeSistema(
      sistema,
      percentualMinimoObrigatorio,
      percentualMinimoGeral
    );

    const nome = sistema.nome || sistema.sistemas?.nome || "Sistema sem nome";
    const percentualAtendimento = validacao.percentualAtingido;

    content += `- ${nome}: ${formatPercent(percentualAtendimento)} ${
      !validacao.atende ? "❌" : ""
    }\n`;
  });

  // Gerar recomendação
  content += "\nRECOMENDAÇÃO\n";
  content += "--------------------------\n";
  content += gerarRecomendacao(
    resultadoConformidade,
    percentualMinimoGeral,
    percentualMinimoObrigatorio
  );

  // Adicionar rodapé
  content += gerarRodape();

  // Criar blob e link para download
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `analise_sistemas_${
    processo.numero_processo || "relatorio"
  }.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporta análise para PDF no formato especificado
 * @param {Array} sistemas - Lista de sistemas analisados
 * @param {Object} processo - Dados do processo
 * @param {Object} parametros - Parâmetros de análise (percentuais mínimos)
 */
export const exportToPDF = (sistemas, processo, parametros) => {
  if (!sistemas || sistemas.length === 0) {
    alert("Sem dados para exportar");
    return;
  }

  // Configurar documento
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Estilo base
  const corPrimaria = [37, 99, 235]; // Azul corporativo
  const corSecundaria = [100, 100, 100]; // Cinza para textos
  const corDestaque = [220, 53, 69]; // Vermelho para alertas
  const corAtende = [40, 167, 69]; // Verde para sistemas que atendem
  const corNaoAtende = [220, 53, 69]; // Vermelho para sistemas que não atendem
  const corNaoAnalisado = [255, 152, 0]; // Laranja para sistemas não analisados

  // Adicionar logo
  try {
    const logoUrl = "/icons/logo-licitacao.png"; // Caminho relativo à pasta public
    doc.addImage(logoUrl, "PNG", 15, 15, 30, 20); // Ajustado altura para 20 para manter proporção

    // Ajustar posição do título para ficar ao lado da logo
    doc.setFontSize(22);
    doc.setTextColor(...corPrimaria);
    doc.text("Análise de Sistemas", pageWidth / 2 + 15, 25, {
      align: "center",
    });
  } catch (error) {
    console.warn("Erro ao carregar logo:", error);
    // Se houver erro, centraliza o título
    doc.setFontSize(22);
    doc.setTextColor(...corPrimaria);
    doc.text("Análise de Sistemas", pageWidth / 2, 20, { align: "center" });
  }

  // Informações do processo (ajustado yPos inicial para não sobrepor a logo)
  doc.setFontSize(11);
  doc.setTextColor(...corSecundaria);
  let yPos = 45; // Aumentado para dar mais espaço após a logo
  const lineHeight = 7;

  // Adicione este log para depuração
  console.log("Processo recebido para exportação:", processo);

  // CORREÇÃO: Usar os dados do processo diretamente, sem depender da função getProcessField
  // Garantir que temos dados válidos ou usar fallbacks
  const numeroProcesso =
    processo.numero_processo || processo.numero || "Não informado";

  const orgao =
    processo.orgao && typeof processo.orgao === "object"
      ? processo.orgao.nome || "Não informado"
      : processo.orgao || processo.orgao_nome || "Não informado";

  const data = processo.data_pregao || processo.data || processo.data_sessao;
  const dataFormatada = data
    ? new Date(data).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "Não informada";

  // Função auxiliar para obter o nome do responsável considerando diferentes formatos
  const getResponsavelNome = (processo) => {
    // Se tiver o objeto completo do responsável
    if (processo.responsavel && processo.responsavel.nome) {
      return processo.responsavel.nome;
    }
    
    // Se tiver apenas o nome do responsável em uma propriedade específica
    if (processo.responsavel_nome) {
      return processo.responsavel_nome;
    }
    
    // Se o campo responsável for uma string (nome direto)
    if (typeof processo.responsavel === 'string' && processo.responsavel) {
      return processo.responsavel;
    }
    
    // Se tiver apenas o ID do responsável, buscar o nome em responsaveis_processos
    if (processo.responsavel_id) {
      // Em vez de mostrar o UUID completo, exibe de forma mais amigável
      return "Responsável atribuído"; // ou "Responsável designado"
    }
    
    // Se nada for encontrado
    return 'Não informado';
  };
  
  // E então, use essa função:
  const responsavel = getResponsavelNome(processo);

  const codigo = processo.codigo_analise || processo.codigo || "Não informado";

  // Adicionar informações do processo no PDF
  const infoProcesso = [
    `Processo: ${numeroProcesso}`,
    `Órgão: ${orgao}`,
    `Data: ${dataFormatada}`,
    `Código: ${codigo}`,
  ];

  infoProcesso.forEach((info) => {
    doc.text(info, 15, yPos);
    yPos += lineHeight;
  });

  // Tabela de sistemas
  const tableData = sistemas.map((sistema) => {
    const nome = sistema.nome || sistema.sistemas?.nome || "Sistema sem nome";
    const total = sistema.totalItens || 0;

    // Verificar se o sistema foi analisado - modificar esta verificação
    const naoAtendidos =
      sistema.naoAtendidos !== undefined &&
      sistema.naoAtendidos !== null &&
      sistema.naoAtendidos !== ""
        ? sistema.naoAtendidos
        : "";

    // Importante: string vazia significa não analisado
    const hasValidNaoAtendidos = naoAtendidos !== "";

    // Calcular valores apenas se tiver sido analisado
    const atendidos = hasValidNaoAtendidos ? total - naoAtendidos : "";
    const percentual =
      hasValidNaoAtendidos && total > 0
        ? (((total - naoAtendidos) / total) * 100).toFixed(2)
        : "";

    // Determinar status e cor
    let status;
    let statusColor;

    if (hasValidNaoAtendidos) {
      const validacao = validarConformidadeSistema(
        sistema,
        parametros.percentualMinimoObrigatorio,
        parametros.percentualMinimoGeral
      );
      status = validacao.atende
        ? "Atende"
        : `Não Atende (Min: ${validacao.percentualMinimo}%)`;
      statusColor = validacao.atende ? corAtende : corNaoAtende;
    } else {
      status = "NÃO ANALISADO";
      statusColor = corNaoAnalisado;
    }

    return {
      nome,
      total: total.toString(),
      atendidos: atendidos.toString(),
      naoAtendidos: naoAtendidos.toString(),
      percentual: percentual !== "" ? `${percentual}%` : "",
      status,
      statusColor,
      obrigatorio: sistema.obrigatorio ? "Sim" : "Não",
      minimo: sistema.percentual_minimo
        ? `${sistema.percentual_minimo}%`
        : "N/A",
    };
  });

  autoTable(doc, {
    startY: yPos + 10,
    head: [
      [
        "Sistema",
        "Total",
        "Atendidos",
        "Não Atendidos",
        "% Atendido",
        "Obrigatório",
        "Mínimo Exigido",
        "Status",
      ],
    ],
    body: tableData.map((sistema) => [
      sistema.nome,
      sistema.total,
      sistema.atendidos,
      sistema.naoAtendidos,
      sistema.percentual,
      sistema.obrigatorio,
      sistema.minimo,
      sistema.status,
    ]),
    styles: {
      fontSize: 9,
      cellPadding: 4,
    },
    rowPageBreak: "auto",
    bodyStyles: {
      valign: "middle",
    },
    // Substituir rowStyles por didParseCell para garantir aplicação correta das cores
    didParseCell: function (data) {
      // Aplicar cores apenas às células do corpo da tabela
      if (data.section === "body") {
        const rowIndex = data.row.index;
        const sistema = tableData[rowIndex];

        if (!sistema) return;

        const isAtende =
          sistema.status.includes("Atende") &&
          !sistema.status.includes("Não Atende");
        const isNaoAtende = sistema.status.includes("Não Atende");
        const isNaoAnalisado = sistema.status.includes("NÃO ANALISADO");

        // Definir as cores com base no status
        if (isAtende) {
          data.cell.styles.fillColor = [229, 252, 235];
          data.cell.styles.textColor = [21, 87, 36];
        } else if (isNaoAtende) {
          data.cell.styles.fillColor = [254, 226, 226];
          data.cell.styles.textColor = [153, 27, 27];
        } else if (isNaoAnalisado) {
          data.cell.styles.fillColor = [255, 243, 226];
          data.cell.styles.textColor = [180, 83, 9];
        }
      }
    },
  });

  // Rodapé
  const addFooter = () => {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(...corSecundaria);

      // Nome do sistema e data/hora
      const dataHora = new Date().toLocaleString("pt-BR");
      doc.text("Sistema de Análise de Editais", 15, 280);
      doc.text(`Emitido em: ${dataHora}`, pageWidth - 15, 280, {
        align: "right",
      });

      // Numeração de páginas
      doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, 280, {
        align: "center",
      });
    }
  };

  addFooter();

  // Corrigir nome do arquivo para garantir que nunca fique "sem-numero"
  const numeroProcessoLimpo =
    numeroProcesso
      .toString()
      .replace(/[\/\\:*?"<>|]/g, "-")
      .replace(/\s+/g, "_")
      .substring(0, 40) || "relatorio";

  const fileName = `RelatorioAnalises-${numeroProcessoLimpo}.pdf`;
  doc.save(fileName);
};

/**
 * Exporta análise para Excel no formato especificado
 * @param {Array} sistemas - Lista de sistemas analisados
 * @param {Object} processo - Dados do processo
 * @param {Object} parametros - Parâmetros de análise (percentuais mínimos)
 */
export const exportToExcel = (sistemas, processo, parametros) => {
  if (!sistemas || sistemas.length === 0) {
    alert("Sem dados para exportar");
    return;
  }

  console.log("processo recebido para exportação:", processo);

  const { percentualMinimoGeral, percentualMinimoObrigatorio } = parametros;

  // Validar conformidade geral
  const resultadoConformidade = validarConformidadeGeral(
    sistemas,
    percentualMinimoGeral,
    percentualMinimoObrigatorio
  );

  // Criar workbook
  const workbook = XLSX.utils.book_new();

  // Aba 1: Detalhes dos Sistemas
  const detalhesData = sistemas.map((sistema) => {
    const nome = sistema.nome || sistema.sistemas?.nome || "Sistema sem nome";
    const total = sistema.totalItens || 0;

    // Verificar se o sistema foi analisado
    const naoAtendidos =
      sistema.naoAtendidos !== undefined && sistema.naoAtendidos !== null
        ? sistema.naoAtendidos
        : "";
    const hasValidNaoAtendidos = naoAtendidos !== "";

    // Calcular valores apenas se tiver sido analisado
    const atendidos = hasValidNaoAtendidos ? total - naoAtendidos : "";
    const percentualAtendimento =
      hasValidNaoAtendidos && total > 0
        ? ((total - naoAtendidos) / total) * 100
        : "";

    const status = hasValidNaoAtendidos
      ? validarConformidadeSistema(
          sistema,
          percentualMinimoObrigatorio,
          percentualMinimoGeral
        ).atende
        ? "Atende"
        : "Não Atende"
      : "NÃO ANALISADO";

    return {
      Sistema: nome,
      "Total de Itens": total || "",
      Atendidos: atendidos !== "" ? atendidos : "N/A",
      "Não Atendidos": naoAtendidos !== "" ? naoAtendidos : "N/A",
      "Percentual de Atendimento":
        percentualAtendimento !== "" ? percentualAtendimento / 100 : "N/A",
      "Mínimo Exigido": sistema.percentual_minimo
        ? sistema.percentual_minimo / 100
        : "N/A",
      Status: status,
      Obrigatório: sistema.obrigatorio ? "Sim" : "Não",
    };
  });

  // Criar a primeira planilha (Detalhes)
  const detalhesWorksheet = XLSX.utils.json_to_sheet(detalhesData);

  // Definir largura das colunas
  detalhesWorksheet["!cols"] = [
    { wch: 40 }, // Sistema
    { wch: 15 }, // Total de Itens
    { wch: 15 }, // Atendidos
    { wch: 15 }, // Não Atendidos
    { wch: 15 }, // Percentual
    { wch: 15 }, // Mínimo Exigido
    { wch: 15 }, // Status
    { wch: 15 }, // Obrigatório
  ];

  // Formatar as células de percentual
  const percentCols = ["E", "F"]; // colunas com percentuais
  const range = XLSX.utils.decode_range(detalhesWorksheet["!ref"]);

  percentCols.forEach((col) => {
    for (let row = range.s.r + 1; row <= range.e.r; row++) {
      const cell = detalhesWorksheet[`${col}${row + 1}`];
      if (cell) cell.z = "0.00%";
    }
  });

  // Adicionar a primeira planilha
  XLSX.utils.book_append_sheet(
    workbook,
    detalhesWorksheet,
    "Detalhes dos Sistemas"
  );

  // Aba 2: Resumo do Processo
  const resumoData = [
    { Campo: "Processo", Valor: processo.numero_processo || "N/A" },
    { Campo: "Órgão", Valor: processo.orgao || "N/A" },
    { Campo: "Data", Valor: formatDate(processo.data_pregao || new Date()) },
    { Campo: "Código", Valor: processo.codigo_analise || "N/A" },
    { Campo: "Percentual Mínimo Geral", Valor: percentualMinimoGeral / 100 },
    {
      Campo: "Percentual Mínimo Obrigatórios",
      Valor: percentualMinimoObrigatorio / 100,
    },
    {
      Campo: "Total de Itens",
      Valor: sistemas.reduce(
        (acc, sistema) => acc + (sistema.totalItens || 0),
        0
      ),
    },
    {
      Campo: "Itens Atendidos",
      Valor: sistemas.reduce(
        (acc, sistema) =>
          acc + ((sistema.totalItens || 0) - (sistema.naoAtendidos || 0)),
        0
      ),
    },
    {
      Campo: "Itens Não Atendidos",
      Valor: sistemas.reduce(
        (acc, sistema) => acc + (sistema.naoAtendidos || 0),
        0
      ),
    },
    {
      Campo: "Percentual Geral de Atendimento",
      Valor: resultadoConformidade.percentualGeralAtendimento / 100,
    },
    {
      Campo: "Status Geral",
      Valor: resultadoConformidade.aprovado ? "Aprovado" : "Reprovado",
    },
    { Campo: "", Valor: "" },
    { Campo: "RECOMENDAÇÃO", Valor: "" },
    {
      Campo: "",
      Valor: gerarRecomendacao(
        resultadoConformidade,
        percentualMinimoGeral,
        percentualMinimoObrigatorio
      ),
    },
  ];

  // Criar a segunda planilha (Resumo)
  const resumoWorksheet = XLSX.utils.json_to_sheet(resumoData);

  // Definir largura das colunas na planilha de resumo
  resumoWorksheet["!cols"] = [
    { wch: 30 }, // Campo
    { wch: 80 }, // Valor
  ];

  // Formatar células de percentual na planilha de resumo
  ["B5", "B6", "B10"].forEach((cell) => {
    if (resumoWorksheet[cell]) resumoWorksheet[cell].z = "0.00%";
  });

  // Adicionar a segunda planilha
  XLSX.utils.book_append_sheet(workbook, resumoWorksheet, "Resumo do Processo");

  // Exportar o arquivo
  XLSX.writeFile(
    workbook,
    `analise_sistemas_${processo.numero_processo || "relatorio"}.xlsx`
  );
};
