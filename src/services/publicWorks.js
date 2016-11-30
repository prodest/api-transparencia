require( '../stringExtensions' );
const sql = require( 'mssql' );
const sqlServerConfig = require( '../config/sqlServer' );
const colorsConfig = require( '../config/colors' );
const sqlTransparenciaConfig = sqlServerConfig.transparencia.sqlConnectionConfig;

module.exports = () => {
    const publickWorksService = new Object();
    const connection = new sql.Connection( sqlTransparenciaConfig );

    function parseDistrictItems( result, idField, labelField, valueField, quantityField, total ) {
        let items = result.map( a => {
            const value = a[ valueField ];
            const percentage = value / total * 100;

            return {
                id: a[ idField ],
                label: a[ labelField ].titleCase(),
                value: +value.toFixed( 2 ),
                quantity: +a[ quantityField ].toFixed( 2 ),
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
            const othersQuantity = others.reduce( ( total, curr ) => total + curr.quantityField, 0 );
            const percentage = othersValue / total * 100;

            items.push( {
                label: 'Outros',
                value: othersValue,
                quantity: othersQuantity,
                percentage: Math.round( percentage ),
                decimalPercentage: percentage,
                color: colorsConfig.othersColor,
                list: false,
                plot: true
            } );
        }

        return items.sort( ( a, b ) => a.label.localeCompare( b.label ) );
    }

    publickWorksService.byCity = ( year ) => {

        return connection.connect()
            .then( conn => {
                return new sql.Request( conn )
                    .input( 'year', sql.Int, year )
                    .query( `select 
                                muni.MUN_NOME as municipio, 
                                muni.MUN_CODIGO as id, 
                                sum(isnull(obra.quantidade,0)) as quantidade,
                                sum(isnull(obra.VALORINICIAL,0)) + SUM(ISNULL(aditamento.valoraditado, 0)) as valor
                            from Obras_Municipio muni
                            join (
                            
                            select COUNT(1) as quantidade,
                                            SUM(obra.VALORINICIAL) as valorinicial,
                                            obra.MUN_CODIGO,
                                            obra.IDCONTRATO,
                                            situacao.CODIGO_OBRA_SITUACAO_TIPO
                                        from Obras_Obra obra
                                        inner join Obras_Contrato cont 
                                            on obra.IDCONTRATO = cont.IDCONTRATO		        
                                        inner join (select IDOBRA, CODIGO_OBRA_SITUACAO_TIPO
                                                from Obras_SituacaoObra A
                                                where CODIGO_OBRA_SITUACAO in (select MAX(CODIGO_OBRA_SITUACAO)
                                                                                from Obras_SituacaoObra B
                                                                                where A.IDOBRA = B.IDOBRA
                                                                                group by IDOBRA)) as situacao
                                            on obra.IDOBRA = situacao.IDOBRA
                                            
                                        where cont.ANOCONTRATO = @year
                                        group by obra.MUN_CODIGO, obra.IDCONTRATO, situacao.CODIGO_OBRA_SITUACAO_TIPO
                                        
                                        
                                        ) AS obra 
                                            on obra.MUN_CODIGO = muni.MUN_CODIGO

                            left join (select IDCONTRATO, SUM(ISNULL(VALORADITADO, 0)) as valoraditado
                                        from Obras_Aditivo
                                        group by IDCONTRATO) as aditamento
                                on obra.IDCONTRATO = aditamento.IDCONTRATO

                            group by muni.MUN_NOME, muni.MUN_CODIGO, muni.ID_IBGE  
                            order by muni.MUN_NOME` );
            } )
            .then( recordsets => {
                connection.close();

                const total = recordsets.reduce( ( total, curr ) => total + curr.valor, 0 );
                const quantityTotal = recordsets.reduce( ( total, curr ) => total + curr.quantidade, 0 );

                return {
                    total: +total.toFixed( 2 ),
                    quantity: +quantityTotal.toFixed( 2 ),
                    items: parseDistrictItems( recordsets, 'id', 'municipio', 'valor', 'quantidade', total ),
                    info: 'Os valores recebidos correspondem ao que o fornecedor recebeu pela prestação do serviço ou entrega do produto, somando o valor pago neste exercício e o pago em restos a pagar.'
                };
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    publickWorksService.lastUpdate = () => {
        return Promise.resolve( new Date() );
    };

    return publickWorksService;
};

