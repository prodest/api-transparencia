const expensesService = require( '../services/expenses' );
const Promise = require( 'bluebird' );

module.exports = () => {
    var expensesController = new Object();

    function resolveExpenses( req, res, next, serviceMethod ) {
        const year = req.query.year;
        const month = req.query.month;
        const originId = req.params.id;

        if ( !year ) {
            return res.status( 400 ).send( 'O parâmetro year é obrigatório.' );
        }

        Promise.all( [
            serviceMethod( year, month, originId ),
            expensesService().lastUpdate()
        ] )
        .then( result => {
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
