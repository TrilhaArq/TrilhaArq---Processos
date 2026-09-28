const { chromium } = require(process.env.PW || 'playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  await p.goto('file://' + __dirname + '/mapeamento.html', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const foot = `<div style="font-family:Arial;font-size:7px;color:#8a948a;width:100%;padding:0 17mm;display:flex;justify-content:space-between">
    <span>Trilha Arquitetura Brasileira · Mapeamento do Processo de Projeto · v1 · 28/09/2026</span>
    <span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
  await p.pdf({ path: __dirname + '/Mapeamento-Processo-Trilha.pdf', format: 'A4', printBackground: true,
    displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: foot, preferCSSPageSize: true });
  await b.close();
})();
