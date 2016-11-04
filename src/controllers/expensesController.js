const expensesService = require( '../services/expenses' );

module.exports = () => {
    var expensesController = new Object();

    function resolveExpenses( req, res, next, serviceMethod ) {
        const year = req.query.year;
        const month = req.query.month;
        const originId = req.params.id;

        if ( !year ) {
            return res.status( 400 ).send( 'O parâmetro year é obrigatório.' );
        }

        serviceMethod( year, month, originId )
        .then( result => {
            return res.json( result );
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
