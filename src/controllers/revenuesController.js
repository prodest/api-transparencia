const revenuesService = require( '../services/revenues' );
const Promise = require( 'bluebird' );

module.exports = () => {
    var revenuesController = new Object();

    function noDataForFilter( next ) {
        const err = new Error( 'Não existem dados para o período consultado.' );
        err.userMessage = 'Não existem dados para o período consultado.';
        err.handled = true;
        err.status = 400;

        next( err );
    }

    function resolveRevenues( req, res, next, serviceMethod ) {
        const from = new Date( req.query.from );
        const to = new Date( req.query.to );
        const id = req.params.id;

        Promise.all( [
            serviceMethod( from, to, id ),
            revenuesService().lastUpdate()
            .catch( err => {
                console.error( err );
                return undefined;
            } )
        ] )
        .then( ( [ result, lastUpdate ] ) => {
            if ( result.items.length === 0 ) {
                return noDataForFilter( next );
            }

            result.lastUpdate = lastUpdate;

            return res.json( result );
        } )
        .catch( err => {
            next( err );
        } );
    }

    revenuesController.byArea = ( req, res, next ) => {

        return resolveRevenues( req, res, next, revenuesService().byArea );
    };

    revenuesController.detail = ( req, res, next ) => {

        return resolveRevenues( req, res, next, revenuesService().detail );
    };

    return revenuesController;
};
