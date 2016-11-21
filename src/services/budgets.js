require( '../stringExtensions' );
const sql = require( 'mssql' );
const sqlServerConfig = require( '../config/sqlServer' );
const colorsConfig = require( '../config/colors' );
const sqlTransparenciaConfig = sqlServerConfig.transparencia.sqlConnectionConfig;

module.exports = () => {
    const budgetsService = new Object();
    const connection = new sql.Connection( sqlTransparenciaConfig );

    function parseItems( buckets, labelField, valueField, total ) {
        let items = buckets.map( a => {
            const value = a[ valueField ];
            const percentage = value / total * 100;

            return {
                label: a[ labelField ].titleCase(),
                value: +value.toFixed( 2 ),
                percentage: Math.round( percentage ),
                decimalPercentage: percentage
            };
        } );

        items = items.sort( ( a, b ) => b.value - a.value );

        items = items.map( ( a, i ) => {
            a.plot = i < 10;
            a.color = a.plot ? colorsConfig.colors[ i ] : colorsConfig.othersColor;
            a.list = true;

            return a;
        } );

        const others = items.filter( a => !a.plot );
        if ( others.length > 0 ) {
            const othersValue = others.reduce( ( total, curr ) => total + curr.value, 0 );
            const percentage = othersValue / total * 100;

            items.push( {
                label: 'Outros',
                value: othersValue,
                percentage: Math.round( percentage ),
                decimalPercentage: percentage,
                color: colorsConfig.othersColor,
                list: false,
                plot: true
            } );
        }

        return items;
    }

    function parseResult( result, labelField, valueField ) {
        const total = result.reduce( ( total, curr ) => total + curr[ valueField ], 0 );

        return {
            total: +total.toFixed( 2 ),
            items: parseItems( result, labelField, valueField, total ),
            info: 'Os valores recebidos correspondem ao que o fornecedor recebeu pela prestação do serviço ou entrega do produto, somando o valor pago neste exercício e o pago em restos a pagar.'
        };
    }

    budgetsService.expected = ( year ) => {

        return connection.connect()
            .then( conn => {
                return new sql.Request( conn )
                    .input( 'year', sql.Int, year )
                    .query( `SELECT
                                doe.[UnidadeGestora],
                                doe.[ValorOrcado]
                                FROM [dbo].[DespesaOrcadaExecutada] AS doe
                                WHERE YEAR(data) = @year` );
            } )
            .then( recordsets => {
                connection.close();
                return parseResult( recordsets, 'UnidadeGestora', 'ValorOrcado' );
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    budgetsService.expectedByExecuted = ( year ) => {
        return connection.connect()
            .then( conn => {
                return new sql.Request( conn )
                    .input( 'year', sql.Int, year )
                    .query( `SELECT
                                doe.[UnidadeGestora],
                                doe.[ValorOrcado],
                                doe.[ValorPago] + doe.[ValorRap] AS ValorExecutado
                                FROM [dbo].[DespesaOrcadaExecutada] AS doe
                                WHERE YEAR(data) = @year` );
            } )
            .then( recordsets => {
                connection.close();

                const expectedTotal = recordsets.reduce( ( total, curr ) => total + curr.ValorOrcado, 0 );
                const executedTotal = recordsets.reduce( ( total, curr ) => total + curr.ValorExecutado, 0 );

                return {
                    total: {
                        expectedValue: expectedTotal,
                        executedValue: executedTotal
                    },
                    items: []
                };
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    budgetsService.lastUpdate = () => {
        return Promise.resolve( undefined );
    };

    return budgetsService;
};

