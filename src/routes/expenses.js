module.exports = app => {

    const expensesController = require( '../controllers/expensesController' )();

    app.get( '/expenses/area', expensesController.byArea );
    app.get( '/expenses/origin', expensesController.byOrigin );
    app.get( '/expenses/area/detail/:id', expensesController.byAreaDetail );
    app.get( '/expenses/origin/detail/:id', expensesController.byOriginDetail );

    return app;
};
