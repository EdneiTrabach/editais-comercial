import jsPDF from 'jspdf';
export declare const certificateService: {
    generateCertificatePDF(certificado: any): Promise<jsPDF>;
    getCertificateTemplate(certificado: any): Promise<string>;
};
