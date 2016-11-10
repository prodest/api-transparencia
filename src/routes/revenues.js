const apicache = require( 'apicache' ).options( { debug: false } ).middleware;

module.exports = app => {

    const revenuesController = require( '../controllers/revenuesController' )();

    app.get( '/revenues/area', apicache( '1 hour' ), revenuesController.byArea );
    app.get( '/revenues/detail/:id', apicache( '1 hour' ), revenuesController.detail );

    return app;
};
