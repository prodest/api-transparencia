const request = require( 'request-promise' );

const transparenciaConfig = require( '../config/portal-transparencia' );

module.exports = () => {
    const lastUpdateService = new Object();

    lastUpdateService.byArea = ( area ) => {
        const uriLastUpdate = `${transparenciaConfig.baseUrl}${transparenciaConfig.ultimaAtualizacao}?area=${area}`;

        const options = {
            uri: uriLastUpdate,
            headers: {
                'User-Agent': 'Request-Promise',
                'Authorization': transparenciaConfig.authorization
            }
        };

        return request( options ).then( lastUpdate => new Date( lastUpdate ) );
    };

    return lastUpdateService;
};
