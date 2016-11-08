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

    function validateParams( year, month, res, next ) {
        if ( !year ) {
            const err = new Error( 'O parâmetro year é obrigatório.' );
            err.userMessage = 'O ano deve ser informado na consulta.';
            err.handled = true;
            err.status = 400;

            next( err );

            return false;
        }

        const currentYear = new Date().getFullYear();
        if ( +year > currentYear || +year < 2004 ) {
            const err = new Error( `O parâmetro year deve estar entre 2004 e ${currentYear}.` );
            noDataForFilter( err, next );

            return false;
        }

        if ( month && ( month < 1 || month > 12 ) ) {
            const err = new Error( 'O parâmetro month deve estar entre 1 e 12.' );
            noDataForFilter( err, next );

            return false;
        }

        return true;
    }

    function resolveExpenses( req, res, next, serviceMethod ) {
        const year = req.query.year;
        const month = req.query.month;
        const originId = req.params.id;

        if ( !validateParams( year, month, res, next ) ) {
            return;
        }

        Promise.all( [
            serviceMethod( year, month, originId ),
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
