const expensesService = require( '../services/expenses' );
const Promise = require( 'bluebird' );

module.exports = () => {
    var expensesController = new Object();

    function noDataForFilter( err, next ) {
        err.userMessage = 'Não existem dados para o período consultado.';
        err.handled = true;
        err.status = 500;

        next( err );
    }

    function resolveExpenses( req, res, next, serviceMethod ) {
        const originId = req.params.id;

        const from = new Date( req.query.from );
        const to = new Date( req.query.to );

        Promise.all( [
            serviceMethod( from, to, originId ),
            expensesService().lastUpdate()
            .catch( err => {
                console.error( err );
                return undefined;
            } )
        ] )
        .then( result => {
            if ( result[ 0 ].items.length === 0 ) {
                const err = new Error( 'Não existem dados para o período consultado.' );
                return noDataForFilter( err, next );
            }

            result[ 0 ].lastUpdate = result[ 1 ];

            return res.json( result[ 0 ] );
        } )
        .catch( err => {
            next( err );
        } );
    }

    expensesController.byArea = ( req, res, next ) => {
        resolveExpenses( req, res, next, expensesService().byArea );
    };

    expensesController.byOrigin = ( req, res, next ) => {
        resolveExpenses( req, res, next, expensesService().byOrigin );
    };

    expensesController.detail = ( req, res, next ) => {
        resolveExpenses( req, res, next, expensesService().byExpenseGroup );
    };

    return expensesController;
};
