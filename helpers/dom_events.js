/**
 * DOM Events helper
 *
 * @author Dave Taylor
 */

define( function ( require ) {
    'use strict';

    // TransitionEnd event
    var transitionEndEventNames = {
        'WebkitTransition' : 'webkitTransitionEnd',
        'MozTransition'    : 'transitionend',
        'OTransition'      : 'oTransitionEnd',
        'msTransition'     : 'MSTransitionEnd',
        'transition'       : 'transitionend'
    };

    return {
        transitionEnd : transitionEndEventNames[ Modernizr.prefixed( 'transition' ) ]
    };

} );