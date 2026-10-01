const { chromium } = require(process.env.PW || 'playwright');
const docs = [
  ['mapeamento.html', 'Mapeamento-Processo-Trilha.pdf', 'Trilha Arquitetura Brasileira · Mapeamento do Processo de Projeto · v1 · 28/09/2026'],
  ['manual.html', 'Manual-Processo-Trilha.pdf', 'Trilha Arquitetura Brasileira · Manual do Processo de Projeto · v1 · 28/09/2026'],
  ['caminho.html', 'Caminho-do-Projeto-Trilha.pdf', 'Trilha Arquitetura Brasileira · O caminho do seu projeto'],
];
(async () => {
  const b = await chromium.launch();
  for (const [src, out, label] of docs) {
    const p = await b.newPage();
    await p.goto('file://' + __dirname + '/' + src, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    const foot = `<div style="font-family:Arial;font-size:7px;color:#8a948a;width:100%;padding:0 17mm;display:flex;justify-content:space-between"><span>${label}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`;
    await p.pdf({ path: __dirname + '/' + out, format: 'A4', printBackground: true, displayHeaderFooter: true, headerTemplate: '<div></div>', footerTemplate: foot, preferCSSPageSize: true });
    await p.close();
  }
  await b.close();
})();
