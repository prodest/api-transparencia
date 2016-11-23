const budgetsService = require( '../services/budgets' );

module.exports = () => {
    var budgetsController = new Object();

    function noDataForFilter( err, next ) {
        err.userMessage = 'Não existem dados para o ano consultado.';
        err.handled = true;
        err.status = 500;

        next( err );
    }

    function resolveBudgets( req, res, next, serviceMethod ) {
        const year = req.query.year;

        Promise.all( [
            serviceMethod( year ),
            budgetsService().lastUpdate()
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

    budgetsController.expected = ( req, res, next ) => {

        return resolveBudgets( req, res, next, budgetsService().expected );
    };

    budgetsController.deviation = ( req, res, next ) => {

        return resolveBudgets( req, res, next, budgetsService().deviation );
    };

    return budgetsController;
};
