import { supabase } from '@/config/supabase'
import html2canvas from 'html2canvas/dist/html2canvas.js'
import { jsPDF } from 'jspdf'

export const certificateService = {
  async generateCertificatePDF(certificado) {
    // Clone o template e preencha com os dados
    const template = document.createElement('div')
    template.innerHTML = await this.getCertificateTemplate(certificado)
    template.style.display = 'none'
    document.body.appendChild(template)
    
    try {
      const canvas = await html2canvas(template, {
        scale: 2,
        useCORS: true,
        logging: false
      })
      
      const imgData = canvas.toDataURL('image/jpeg', 1.0)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const imgProps = pdf.getImageProperties(imgData)
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width
      
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
      return pdf
    } finally {
      document.body.removeChild(template)
    }
  },

  async getCertificateTemplate(certificado) {
    return `
      <div class="certificate-container" style="
        width: 1123px;
        height: 794px;
        padding: 40px;
        background: #fff;
        position: relative;
        font-family: 'Times New Roman', serif;
      ">
        <!-- Borda decorativa -->
        <div style="
          border: 2px solid #193155;
          border-radius: 20px;
          height: 100%;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
        "></div>
        
        <!-- Cabeçalho -->
        <div style="text-align: center; margin-top: 40px;">
          <img src="/public/logo.png" style="width: 150px;" />
          <h1 style="
            color: #193155;
            font-size: 48px;
            margin: 20px 0;
          ">CERTIFICADO</h1>
        </div>

        <!-- Corpo -->
        <div style="
          text-align: center;
          margin: 40px;
          font-size: 24px;
          line-height: 1.6;
        ">
          <p>Certificamos que</p>
          <h2 style="
            color: #193155;
            font-size: 36px;
            margin: 20px 0;
          ">${certificado.usuario?.nome}</h2>
          <p>concluiu com êxito o curso de</p>
          <h3 style="
            color: #193155;
            font-size: 32px;
            margin: 20px 0;
          ">${certificado.curso?.nome}</h3>
          <p>com carga horária de ${certificado.curso?.duracao_horas} horas.</p>
        </div>

        <!-- Rodapé -->
        <div style="
          position: absolute;
          bottom: 40px;
          width: calc(100% - 80px);
          text-align: center;
        ">
          <p style="margin-bottom: 20px;">
            ${new Date(certificado.data_emissao).toLocaleDateString('pt-BR')}
          </p>
          <div style="
            display: flex;
            justify-content: space-around;
            margin-top: 40px;
          ">
            <div>
              <div style="
                border-top: 2px solid #193155;
                width: 200px;
                padding-top: 10px;
              ">
                Diretor(a)
              </div>
            </div>
            <div>
              <div style="
                border-top: 2px solid #193155;
                width: 200px;
                padding-top: 10px;
              ">
                Coordenador(a)
              </div>
            </div>
          </div>
        </div>

        <!-- Código do certificado -->
        <div style="
          position: absolute;
          bottom: 20px;
          right: 40px;
          font-size: 12px;
          color: #666;
        ">
          Código: ${certificado.codigo}
        </div>
      </div>
    `;
  }
}
