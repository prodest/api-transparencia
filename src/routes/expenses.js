const apicache = require( 'apicache' ).options( { debug: false } ).middleware;

module.exports = app => {

    const expensesController = require( '../controllers/expensesController' )();

    app.get( '/expenses/area', apicache( '1 hour' ), expensesController.byArea );
    app.get( '/expenses/origin', apicache( '1 hour' ), expensesController.byOrigin );
    app.get( '/expenses/detail/:id', apicache( '1 hour' ), expensesController.detail );

    return app;
};
