const elasticsearch = require( 'elasticsearch' );

const es_host = process.env.ELASTICSEARCH;

module.exports = {
    host: es_host,
    client: new elasticsearch.Client( {
        host: es_host,
        log: 'error'
    } )
};
