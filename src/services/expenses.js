const elasticsearch = require( '../config/elasticsearch' );

module.exports = () => {
    const expensesService = new Object();

    /**
     *
     *
     * @param {any} year
     * @param {any} month
     * @param {any} groupBy
     * @param {any} filter
     * @returns
     */
    function parseBody( year, month, groupBy, filter ) {

        const body =
            {
                'size': 0,
                'sort': [
                    '_score'
                ],
                'query': {
                    'bool': {
                        'must': [
                            {
                                'term': {
                                    'ano': {
                                        'value': year
                                    }
                                }
                            }
                        ]
                    }
                },
                'aggs': {
                    'group_by': {
                        'terms': {
                            'field': groupBy,
                            'size': 0
                        },
                        'aggs': {
                            'Empenhado': {
                                'sum': {
                                    'field': 'valorEmpenho'
                                }
                            },
                            'Liquidado': {
                                'sum': {
                                    'field': 'valorLiquidado'
                                }
                            },
                            'Pago': {
                                'sum': {
                                    'field': 'valorPago'
                                }
                            },
                            'Rap': {
                                'sum': {
                                    'field': 'valorRap'
                                }
                            },
                            'First': {
                                'top_hits': {
                                    'size': 1
                                }
                            }
                        }
                    },
                    'EmpenhadoTotal': {
                        'sum': {
                            'field': 'valorEmpenho'
                        }
                    },
                    'LiquidadoTotal': {
                        'sum': {
                            'field': 'valorLiquidado'
                        }
                    },
                    'PagoTotal': {
                        'sum': {
                            'field': 'valorPago'
                        }
                    },
                    'RapTotal': {
                        'sum': {
                            'field': 'valorRap'
                        }
                    }
                }
            };

        if ( filter ) {
            body.query.bool.must.push( filter );
        }

        if ( month ) {
            const beginDate = new Date( +year, +month - 1, 1 );
            const endDate = new Date( +year, +month, 0 );

            body.query.bool.must.push(
                {
                    'range': {
                        'data': {
                            'gte': beginDate,
                            'lte': endDate
                        }
                    }
                } );
        }

        return body;
    }

    const colors = [ '#8BC34A', '#03A9F4', '#FFEB3B', '#FF5722', '#9C27B0', '#795548', '#E91E63', '#3F51B5', '#F44336', '#009688',
                     '#2196F3', '#00BCD4', '#673AB7', '#4CAF50', '#DCE77', '#FFF9C4', '#FB8C00', '#FFB300', '#607D8B' ];
    const othersColor = '#9E9E9E';

    function parseItems( buckets, labelField, keyField, total ) {
        let items = buckets.map( a => {
            const value = a.Pago.value + a.Rap.value;
            const percentage = value / total * 100;

            return {
                originId: `${keyField}_${a.First.hits.hits[ 0 ]._source[ keyField ]}`,
                label: a.First.hits.hits[ 0 ]._source[ labelField ].trim().toLowerCase(),
                value: +value.toFixed( 2 ),
                percentage: Math.round( percentage ),
                decimalPercentage: percentage
            };
        } );

        items = items.sort( ( a, b ) => b.value - a.value );

        items = items.map( ( a, i ) => {
            a.plot = i < 10;
            a.color = a.plot ? colors[ i ] : othersColor;
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
                color: othersColor,
                list: false,
                plot: true
            } );
        }

        return items;
    }

    function parseResult( result, labelField, keyField ) {
        const total = result.aggregations.PagoTotal.value + result.aggregations.RapTotal.value;

        return {
            total: +total.toFixed( 2 ),
            items: parseItems( result.aggregations.group_by.buckets, labelField, keyField, total ),
            lastUpdate: new Date(),
            info: 'Os valores recebidos correspondem ao que o fornecedor recebeu pela prestação do serviço ou entrega do produto, somando o valor pago neste exercício e o pago em restos a pagar.'
        };
    }

    function byExpenseGroup( year, month, field, originId ) {

        const filter = {
            'term': new Object()
        };

        filter.term[ field ] = {
            'value': originId
        };

        return elasticsearch.client.search( {
            index: `despesas${year}`,
            body: parseBody( year, month, 'codigoGrupoDespesa', filter )
        } )
        .then( result => parseResult( result, 'grupoDespesa', 'codigoGrupoDespesa' ) );
    }

    expensesService.byArea = ( year, month ) => {

        return elasticsearch.client.search( {
            index: `despesas${year}`,
            body: parseBody( year, month, 'codigoFuncao' )
        } )
        .then( result => parseResult( result, 'funcao', 'codigoFuncao' ) );
    };

    expensesService.byOrigin = ( year, month ) => {

        return elasticsearch.client.search( {
            index: `despesas${year}`,
            body: parseBody( year, month, 'codigoUnidadeGestora' )
        } )
        .then( result => parseResult( result, 'unidadeGestora', 'codigoUnidadeGestora' ) );
    };

    expensesService.byExpenseGroup = ( year, month, originId ) => {
        const keyField = originId.split( '_' )[ 0 ];
        const id = originId.split( '_' )[ 1 ];

        return byExpenseGroup( year, month, keyField, id );
    };

    return expensesService;
};
