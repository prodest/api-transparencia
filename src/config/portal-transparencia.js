module.exports = {
    baseUrl: process.env.TRANSPARENCIA_BASE_URL || 'https://betatransparencia.es.gov.br/',
    obrasHistorico: process.env.TRANSPARENCIA_OBRAS_HISTORICO || 'Obras/ObrasDetalhe/ObterHistorico/',
    obrasDetalhe: process.env.TRANSPARENCIA_OBRAS_DETALHE || 'Obras/ObrasDetalhe/ObterDetalhe/',
    authorization: process.env.TRANSPARENCIA_AUTHORIZATION
};
