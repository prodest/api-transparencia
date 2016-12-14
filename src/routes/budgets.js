const apicache = require( 'apicache' ).options( { debug: false } ).middleware;
const cacheSuccesses = apicache( '1 hour', req => req.statusCode < 400 );

module.exports = app => {

    const budgetsController = require( '../controllers/budgetsController' )();

    app.get( '/budgets/expected', cacheSuccesses, budgetsController.expected );
    app.get( '/budgets/deviation', cacheSuccesses, budgetsController.deviation );

    return app;
};
