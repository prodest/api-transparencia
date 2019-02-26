require('../stringExtensions');

const lastUpdateService = require('./lastUpdate');
const elasticsearch = require('../config/elasticsearch');
const colorsConfig = require('../config/colors');

module.exports = () => {
    const revenuesService = new Object();

    function parseBody(from, to, groupBy, filter) {
        const body =
        {
            "size": 0,
            "sort": [
                "_score"
            ],
            "query": {
                "bool": {
                    "must": [
                        {
                            "range": {
                                "dataEmissao": {
                                    "gte": from,
                                    "lt": to
                                }
                            }
                        }
                    ]
                }
            },
            "aggs": {
                "group_by": {
                    "terms": {
                        "field": groupBy,
                        "size": 0
                    },
                    "aggs": {
                        "Prevista": {
                            "sum": {
                                "field": "valorPrevista"
                            }
                        },
                        "Arrecadada": {
                            "sum": {
                                "field": "valorArrecadada"
                            }
                        },
                        "First": {
                            "top_hits": {
                                "size": 1
                            }
                        }
                    }
                },
                "PrevistaTotal": {
                    "sum": {
                        "field": "valorPrevista"
                    }
                },
                "ArrecadadaTotal": {
                    "sum": {
                        "field": "valorArrecadada"
                    }
                }
            }
        };

        if (filter) {
            body.query.bool.must.push(filter);
        }

        return body;
    }

    function parseItems(buckets, keyField, labelField, valueField, total) {
        let items = buckets.map(a => {
            const value = a[valueField].value;
            const percentage = value / total * 100;
            const source = a.First.hits.hits[ 0 ]._source;

            return {
                originId: source[keyField],
                label: source[labelField].titleCase(),
                value: +value.toFixed(2),
                percentage: Math.round(percentage),
                decimalPercentage: percentage
            };
        });

        items = items.sort((a, b) => b.decimalPercentage - a.decimalPercentage);

        items = items.map((a, i) => {
            a.plot = i < 10;
            a.color = a.plot ? colorsConfig.colors[i] : colorsConfig.othersColor;
            a.list = true;

            return a;
        });

        const others = items.filter(a => !a.plot && a.value > 0);
        if (others.length > 0) {
            const othersValue = others.reduce((total, curr) => total + curr.value, 0);
            const percentage = othersValue / total * 100;

            items.push({
                label: 'Outros',
                value: othersValue,
                percentage: Math.round(percentage),
                decimalPercentage: percentage,
                color: colorsConfig.othersColor,
                list: false,
                plot: true
            });
        }

        return items;
    }

    function parseResult(result, keyField, labelField, valueField) {
        const total = result.aggregations.ArrecadadaTotal.value;

        return {
            total: +total.toFixed(2),
            items: parseItems(result.aggregations.group_by.buckets, keyField, labelField, valueField, total),
            info: 'Nesta consulta são exibidos os valores arrecadados pelo Estado, agregados por seus respectivos órgãos.'
        };
    }

    revenuesService.byArea = (from, to) => {

        return elasticsearch.client.search({
            index: 'receitas*',
            body: parseBody(from, to, 'codigoRubrica')
        })
            .then(result => parseResult(result, 'codigoRubrica', 'descricaoRubrica', 'Arrecadada'));
    };

    revenuesService.detail = (from, to, id) => {

        const filter = {
            'term': {
                'codigoRubrica': id
            }
        };

        return elasticsearch.client.search({
            index: 'receitas*',
            body: parseBody(from, to, 'codigoSubAlinea', filter)
        })
            .then(result => parseResult(result, 'codigoSubAlinea', 'descricaoSubAlinea', 'Arrecadada'));
    };

    revenuesService.lastUpdate = () => {
        return lastUpdateService().byArea('Receita');
    };

    return revenuesService;
};

