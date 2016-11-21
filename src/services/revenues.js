require( '../stringExtensions' );
const sql = require( 'mssql' );
const sqlServerConfig = require( '../config/sqlServer' );
const colorsConfig = require( '../config/colors' );
const sqlTransparenciaConfig = sqlServerConfig.transparencia.sqlConnectionConfig;

module.exports = () => {
    const revenuesService = new Object();
    const connection = new sql.Connection( sqlTransparenciaConfig );

    function parseItems( buckets, keyField, labelField, valueField, total ) {
        let items = buckets.map( a => {
            const value = a[ valueField ];
            const percentage = value / total * 100;

            return {
                originId: a[ keyField ],
                label: a[ labelField ].titleCase(),
                value: +value.toFixed( 2 ),
                percentage: Math.round( percentage ),
                decimalPercentage: percentage
            };
        } );

        items = items.sort( ( a, b ) => b.decimalPercentage - a.decimalPercentage );

        items = items.map( ( a, i ) => {
            a.plot = i < 10;
            a.color = a.plot ? colorsConfig.colors[ i ] : colorsConfig.othersColor;
            a.list = true;

            return a;
        } );

        const others = items.filter( a => !a.plot && a.value > 0 );
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

    function parseResult( result, keyField, labelField, valueField ) {
        const total = result.reduce( ( total, curr ) => total + curr[ valueField ], 0 );

        return {
            total: +total.toFixed( 2 ),
            items: parseItems( result, keyField, labelField, valueField, total ),
            info: 'Os valores recebidos correspondem ao que o fornecedor recebeu pela prestação do serviço ou entrega do produto, somando o valor pago neste exercício e o pago em restos a pagar.'
        };
    }

    revenuesService.byArea = ( from, to ) => {

        return connection.connect()
            .then( conn => {
                return new sql.Request( conn )
                    .input( 'dataInicio', sql.Date, from )
                    .input( 'dataFim', sql.Date, to )
                    .query( `SELECT
                                Rec.[codRubrica],
                                Rec.[dsRubrica],
                                SUM(Rec.[vlRealizado]) as vlRealizado
                                FROM [dbo].[Receita] AS Rec
                                WHERE (Rec.[data] >= @dataInicio) AND (Rec.[data] <= @dataFim)
                                GROUP BY Rec.[codRubrica], Rec.[dsRubrica]` );
            } )
            .then( recordsets => {
                connection.close();
                return parseResult( recordsets, 'codRubrica', 'dsRubrica', 'vlRealizado' );
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    revenuesService.detail = ( from, to, id ) => {

        return connection.connect()
            .then( conn => {
                return new sql.Request( conn )
                    .input( 'dataInicio', sql.Date, from )
                    .input( 'dataFim', sql.Date, to )
                    .input( 'codRubrica', sql.Int, id )
                    .query( `SELECT
                                Rec.[codSubAlinea],
                                Rec.[dsSubAlinea],
                                SUM(Rec.[vlRealizado]) as vlRealizado
                                FROM [dbo].[Receita] AS Rec
                                WHERE Rec.[data] >= @dataInicio AND Rec.[data] <= @dataFim
                                  AND Rec.[codRubrica] = @codRubrica
                                GROUP BY Rec.[codSubAlinea], Rec.[dsSubAlinea]` );
            } )
            .then( recordsets => {
                connection.close();
                return parseResult( recordsets, 'codSubAlinea', 'dsSubAlinea', 'vlRealizado' );
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    revenuesService.lastUpdate = () => {
        return Promise.resolve( undefined );
    };

    return revenuesService;
};

