String.prototype.titleCase = function( ) {
    let str = this.toLowerCase();

    str = str.replace( /(?:\s?)(\S*)/g, ( a, b ) => {
        if ( b.length > 2 ) {
            return ' ' + b[ 0 ].toUpperCase() + b.slice( 1 );
        }
        return ' ' + b;
    } );

    return str.trim();
};
