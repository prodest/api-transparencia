const apicache = require( 'apicache' ).options( { debug: false } ).middleware;

module.exports = app => {

    const publicWorksController = require( '../controllers/publicWorksController' )();

    app.get( '/public-works/districts', apicache( '1 second' ), publicWorksController.districts );

    return app;
};
