require( '../stringExtensions' );
const sql = require( 'mssql' );

const lastUpdateService = require( './lastUpdate' );
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

    function parseResult( result, labelField, valueField, info ) {
        const total = result.reduce( ( total, curr ) => total + curr[ valueField ], 0 );

        return {
            total: +total.toFixed( 2 ),
            items: parseItems( result, labelField, valueField, total ),
            info: info || 'Nesta consulta são exibidos os valores orçados pelo Estado, agregados por seus respectivos órgãos.'
        };
    }

    budgetsService.expected = ( year ) => {

        const info = 'Nesta consulta são exibidos os valores orçados pelo Estado, agregados por seus respectivos órgãos.';

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
                return parseResult( recordsets, 'UnidadeGestora', 'ValorOrcado', info );
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    function parseDeviationItems( buckets ) {

        let items = buckets.map( a => {
            const percentage = a.ValorOrcado ? a.ValorPago / a.ValorOrcado * 100 : 0;

            return {
                label: a.UnidadeGestora.titleCase(),
                expected: +a.ValorOrcado.toFixed( 2 ),
                executed: +a.ValorPago.toFixed( 2 ),
                percentage: Math.round( percentage ),
                decimalPercentage: percentage
            };
        } );

        return items;
    }

    budgetsService.deviation = ( year ) => {
        const info = 'Nesta consulta é exibida uma comparação entre os valores orçados e executados por cada Órgão do do Governo do Estado.';        
        
        return connection.connect()
            .then( conn => {
                return new sql.Request( conn )
                    .input( 'year', sql.Int, year )
                    .query( `SELECT
                                doe.[UnidadeGestora],
                                doe.[ValorOrcado],
                                doe.[ValorPago]
                                FROM [dbo].[DespesaOrcadaExecutada] AS doe
                                WHERE YEAR(data) = @year` );
            } )
            .then( recordsets => {
                connection.close();

                const expectedTotal = recordsets.reduce( ( total, curr ) => total + curr.ValorOrcado, 0 );
                const executedTotal = recordsets.reduce( ( total, curr ) => total + curr.ValorPago, 0 );
                const percentage = executedTotal / expectedTotal * 100;

                return {
                    expected: +expectedTotal.toFixed( 2 ),
                    executed: +executedTotal.toFixed( 2 ),
                    expectedColor: colorsConfig.deviationColors.expected,
                    executedColor: colorsConfig.deviationColors.executed,
                    percentage: Math.round( percentage ),
                    decimalPercentage: percentage,
                    items: parseDeviationItems( recordsets ),
                    info: info
                };
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    budgetsService.lastUpdate = () => {
        return lastUpdateService().byArea( 'OrcamentoExecucao' );
    };

    return budgetsService;
};

