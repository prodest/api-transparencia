const apicache = require( 'apicache' ).options( { debug: false } ).middleware;
const cacheSuccesses = apicache( '1 hour', req => req.statusCode < 400 );

module.exports = app => {

    const revenuesController = require( '../controllers/revenuesController' )();

    app.get( '/revenues/area', cacheSuccesses, revenuesController.byArea );
    app.get( '/revenues/detail/:id', cacheSuccesses, revenuesController.detail );

    return app;
};
