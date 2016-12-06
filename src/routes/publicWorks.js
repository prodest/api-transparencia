const apicache = require( 'apicache' ).options( { debug: false } ).middleware;

module.exports = app => {

    const publicWorksController = require( '../controllers/publicWorksController' )();

    app.get( '/public-works/by-city', apicache( '1 hour' ), publicWorksController.byCity );
    app.get( '/public-works/list', apicache( '1 hour' ), publicWorksController.list );
    app.get( '/public-works/detail/:id', apicache( '1 hour' ), publicWorksController.detail );

    return app;
};
