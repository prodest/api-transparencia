module.exports = app => {

    const expensesController = require( '../controllers/expensesController' )();

    app.get( '/expenses/area', expensesController.byArea );
    app.get( '/expenses/origin', expensesController.byOrigin );
    app.get( '/expenses/detail/:id', expensesController.detail );

    return app;
};
