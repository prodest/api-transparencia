const publicWorksService = require( '../services/publicWorks' );

module.exports = () => {
    var publicWorksController = new Object();

    function noDataForFilter( err, next ) {
        err.userMessage = 'Não existem dados para o ano consultado.';
        err.handled = true;
        err.status = 500;

        next( err );
    }

    function resolvePublicWorks( req, res, next, serviceMethod ) {

        Promise.all( [
            serviceMethod,
            publicWorksService().lastUpdate()
            .catch( err => {
                console.error( err );
                return undefined;
            } )
        ] )
        .then( ( [ result, lastUpdate ] ) => {
            if ( result.items.length === 0 ) {
                const err = new Error( 'Não existem dados para o ano consultado.' );
                noDataForFilter( err, next );
            }

            result.lastUpdate = lastUpdate;

            return res.json( result );
        } )
        .catch( err => {
            next( err );
        } );
    }

    publicWorksController.byCity = ( req, res, next ) => {
        const year = req.query.year;

        return resolvePublicWorks( req, res, next, publicWorksService().byCity( year ) );
    };

    publicWorksController.list = ( req, res, next ) => {
        const year = req.query.year;
        const cityId = req.query.cityId;

        return resolvePublicWorks( req, res, next, publicWorksService().list( cityId, year ) );
    };

    return publicWorksController;
};
