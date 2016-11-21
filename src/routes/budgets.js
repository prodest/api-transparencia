const apicache = require( 'apicache' ).options( { debug: false } ).middleware;

module.exports = app => {

    const budgetsController = require( '../controllers/budgetsController' )();

    app.get( '/budgets/expected', apicache( '1 hour' ), budgetsController.expected );

    return app;
};
