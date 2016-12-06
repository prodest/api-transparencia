module.exports = {
    baseUrl: process.env.TRANSPARENCIA_BASE_URL || 'https://betatransparencia.es.gov.br/',
    obrasHistorico: process.env.TRANSPARENCIA_OBRAS_HISTORICO || 'Obras/ObrasDetalhe/ObterHistorico/',
    obrasDetalhe: process.env.TRANSPARENCIA_OBRAS_DETALHE || 'Obras/ObrasDetalhe/ObterDetalhe/',
    ultimaAtualizacao: process.env.TRANSPARENCIA_ULTIMA_ATUALIZACAO || 'DadosAbertos/UltimaAtualizacao/',
    authorization: process.env.TRANSPARENCIA_AUTHORIZATION
};
