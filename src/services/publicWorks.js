require( '../stringExtensions' );

const sql = require( 'mssql' );
const Promise = require( 'bluebird' );
const request = require( 'request-promise' );

const lastUpdateService = require( './lastUpdate' );
const sqlServerConfig = require( '../config/sqlServer' );
const colorsConfig = require( '../config/colors' );
const transparenciaConfig = require( '../config/portal-transparencia' );

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

        return items;
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
                                            obra.IDCONTRATO
                                        
                                        from Obras_Obra obra
                                        inner join Obras_Contrato cont 
                                            on obra.IDCONTRATO = cont.IDCONTRATO		        
                                            
                                        where cont.ANOCONTRATO = @year
                                        group by obra.MUN_CODIGO, obra.IDCONTRATO

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
                    info: 'Nesta consulta são exibidas as obras realizadas pelo Governo do Estado em cada município, bem como os valores e detalhes sobre a execução.'
                };
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    function parseStatus( status ) {
        status = status || '';

        if ( status.length > 15 ) {
            status = status.split( ' ' )[ 0 ];
        }

        return status;
    }

    function parseListItems( result, idField, labelField, statusField, valueField, total ) {
        let items = result.map( a => {
            const value = a[ valueField ];
            const percentage = value / total * 100;
            let label = a[ labelField ].titleCase();
            let status = parseStatus( a[ statusField ] );

            if ( label.length > 100 ) {
                label = label.substring( 0, 100 ) + '...';
            }

            return {
                id: a[ idField ],
                label: label,
                status: status,
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

    publickWorksService.list = ( cityId, year ) => {

        return connection.connect()
            .then( conn => {
                return new sql.Request( conn )
                    .input( 'year', sql.Int, year )
                    .input( 'cityId', sql.Int, cityId )
                    .query( `select
                                obra.BEMPUBLICO as descricao,
                                situacao.DESCRICAO as situacao,
                                muni.MUN_NOME as municipio,
                                ISNULL(obra.VALORINICIAL,0) + ISNULL(aditamento.valoraditado, 0) as valor,
                                obra.IDOBRA as id
                            from Obras_Obra obra
                                left join Obras_SetorBeneficiado setor 
                                    on obra.IDSETORBENEFICIADO = setor.IDSETORBENEFICIADO 
                                left join Obras_Municipio muni 
                                    on obra.MUN_CODIGO = muni.MUN_CODIGO
                                left join Obras_Macrorregiao macro
                                    on macro.Id = muni.MacrorregiaoId
                                left join Obras_Entidade orgao
                                    on obra.CNPJ_CPF_COD_TCE_ENTIDADE = orgao.CNPJ_CPF_COD_TCE_ENTIDADE
                                left join Obras_Contrato cont
                                    on cont.IDCONTRATO = obra.IDCONTRATO
                                left join (select IDCONTRATO, SUM(ISNULL(VALORADITADO, 0)) as valoraditado
                                            from Obras_Aditivo
                                            group by IDCONTRATO) as aditamento
                                    on obra.IDCONTRATO = aditamento.IDCONTRATO
                                left join (select SO.IDOBRA, SO.CODIGO_OBRA_SITUACAO_TIPO, TSO.DESCRICAO
                                                from Obras_SituacaoObra SO
                                                join Obras_TipoSituacaoObra TSO 
                                                    on SO.CODIGO_OBRA_SITUACAO_TIPO = TSO.CODIGO_OBRA_SITUACAO_TIPO
                                                where CODIGO_OBRA_SITUACAO in (select MAX(CODIGO_OBRA_SITUACAO)
                                                                                from Obras_SituacaoObra
                                                                                group by IDOBRA)) as situacao
                                    on obra.IDOBRA = situacao.IDOBRA
                            where 
                                (muni.MUN_CODIGO = @cityId) AND
                                (cont.ANOCONTRATO = @year)

                            order by descricao` );
            } )
            .then( recordsets => {
                connection.close();

                const total = recordsets.reduce( ( total, curr ) => total + curr.valor, 0 );

                return {
                    city: recordsets[ 0 ].municipio,
                    total: +total.toFixed( 2 ),
                    items: parseListItems( recordsets, 'id', 'descricao', 'situacao', 'valor', total ),
                    info: 'Nesta consulta são exibidas as obras realizadas pelo Governo do Estado em cada município, bem como os valores e detalhes sobre a execução.'
                };
            } )
            .catch( err => {
                connection.close();
                return Promise.reject( err );
            } );
    };

    publickWorksService.detail = ( id ) => {
        const uriDetail = `${transparenciaConfig.baseUrl}${transparenciaConfig.obrasDetalhe}${id}`;
        const uriHistory = `${transparenciaConfig.baseUrl}${transparenciaConfig.obrasHistorico}${id}`;

        const detail = {
            uri: uriDetail,
            headers: {
                'User-Agent': 'Request-Promise',
                'Authorization': transparenciaConfig.authorization
            },
            json: true
        };

        const history = {
            uri: uriHistory,
            headers: {
                'User-Agent': 'Request-Promise',
                'Authorization': transparenciaConfig.authorization
            },
            json: true
        };

        return request( detail )
            .then( detail => {
                return {
                    origin: detail.InfoObra.Orgao.split( '-' )[ 0 ],
                    label: detail.InfoObra.Descricao.titleCase(),
                    description: detail.InfoObra.Objeto.titleCase(),
                    estimate: detail.InfoExecucao.PrazoTotal,
                    city: detail.InfoObra.Municipio,
                    value: detail.InfoExecucao.ValorTotal,
                    date: detail.InfoContrato.DtContrato,
                    status: parseStatus( detail.InfoExecucao.Situacao ),
                    fullStatus: detail.InfoExecucao.Situacao
                };
            } );
    };

    publickWorksService.lastUpdate = () => {
        return lastUpdateService().byArea( 'Obra' );
    };

    return publickWorksService;
};

