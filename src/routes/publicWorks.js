const apicache = require( 'apicache' ).options( { debug: false } ).middleware;
const cacheSuccesses = apicache( '1 hour', req => req.statusCode < 400 );

module.exports = app => {

    const publicWorksController = require( '../controllers/publicWorksController' )();

    app.get( '/public-works/by-city', cacheSuccesses, publicWorksController.byCity );
    app.get( '/public-works/list', cacheSuccesses, publicWorksController.list );
    app.get( '/public-works/detail/:id', cacheSuccesses, publicWorksController.detail );

    return app;
};
