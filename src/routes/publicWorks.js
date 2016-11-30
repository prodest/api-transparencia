const apicache = require( 'apicache' ).options( { debug: false } ).middleware;

module.exports = app => {

    const publicWorksController = require( '../controllers/publicWorksController' )();

    app.get( '/public-works/by-city', apicache( '1 hour' ), publicWorksController.byCity );

    return app;
};
