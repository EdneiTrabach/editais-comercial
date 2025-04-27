// Script para adicionar localhost:8000 ao CSP durante o desenvolvimento
(() => {
  try {
    const metaTags = document.head.querySelectorAll('meta[http-equiv="Content-Security-Policy"]');
    if (metaTags.length > 0) {
      const metaTag = metaTags[0];
      const content = metaTag.getAttribute('content');
      if (content && !content.includes('http://localhost:8000')) {
        const newContent = content.replace(
          'connect-src', 
          'connect-src http://localhost:8000'
        );
        metaTag.setAttribute('content', newContent);
        console.log('CSP modificado para permitir localhost:8000');
      }
    }
  } catch (error) {
    console.error('Erro ao modificar CSP:', error);
  }
})();