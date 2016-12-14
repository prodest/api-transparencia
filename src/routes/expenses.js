const apicache = require( 'apicache' ).options( { debug: false } ).middleware;
const cacheSuccesses = apicache( '1 hour', req => req.statusCode < 400 );

module.exports = app => {

    const expensesController = require( '../controllers/expensesController' )();

    app.get( '/expenses/area', cacheSuccesses, expensesController.byArea );
    app.get( '/expenses/origin', cacheSuccesses, expensesController.byOrigin );
    app.get( '/expenses/detail/:id', cacheSuccesses, expensesController.detail );

    return app;
};
