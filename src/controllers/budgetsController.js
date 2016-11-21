const budgetsService = require( '../services/budgets' );

module.exports = () => {
    var budgetsController = new Object();

    function noDataForFilter( err, next ) {
        err.userMessage = 'Não existem dados para o ano consultado.';
        err.handled = true;
        err.status = 500;

        next( err );
    }

    budgetsController.expected = ( req, res, next ) => {
        const year = req.query.year;

        budgetsService().expected( year )
        .then( result => {
            if ( result.items.length === 0 ) {
                const err = new Error( 'Não existem dados para o ano consultado.' );
                noDataForFilter( err, next );
            }

            return res.json( result );
        } )
        .catch( err => {
            next( err );
        } );
    };

    return budgetsController;
};
