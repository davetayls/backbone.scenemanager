/**
 * SceneManager view
 *
 * @author Dave Taylor <dave.taylor@pogokid.com>
 * @author Robin North <robin@playnicely.co.uk>
 *
 */

define( function( require ) {
    'use strict';

    var Backbone = require( 'backbone' ),
        DOM_EVENTS = require( 'helpers/dom_events' )
        ;

    return Backbone.View.extend( {

        attributes : {
            class  : 'scene'
        },
        defaults   : {
            container         : '<div class="scene__item" />',
            containersNumber  : 3,
            initialTransition : true,
            shown             : true,
            transitions       : true
        },

        initialize : function() {

            // Init properties
            _.defaults( this.options, this.defaults );

            this.$currentContainer = null;
            this.currentSceneItem = null;
            this.currentSceneItemIndex = 0;
            this.containers = [];
            this.history = [];
            this.historyPosition = 0;
            this.transitionsActive = false;

            // Bind contexts
            _.bindAll( this, 'showTransitions', 'onTransitionEnd' );

            // Apply attributes if $el already exists
            if ( this.$el ) {
                this.$el.attr( _.result( this, 'attributes' ) );
            }

            // Capture transitionend events
            this.$el.on( DOM_EVENTS.transitionEnd, this.onTransitionEnd );
        },
        render     : function() {

            var i;

            // Show or hide scene, based on options
            if ( this.options.shown ) {
                this.show();
            } else {
                this.hide();
            }

            // Inject scene content containers
            for ( i = 0; i < this.options.containersNumber; i++ ) {
                var $container = $( this.options.container );
                this.$el.append( $container );
                this.containers.push( $container );
            }

        },

        getNextIndex     : function() {
            if ( this.currentSceneItemIndex + 1 >= this.containers.length ) {
                return 0;
            } else {
                return this.currentSceneItemIndex + 1;
            }
        },
        getNextContainer : function() {
            this.currentSceneItemIndex = this.getNextIndex();
            return this.containers[this.currentSceneItemIndex];
        },

        showSceneItem    : function( sceneItem, back ) {

            // cache pointers so we can do this async
            var currentSceneItem = this.currentSceneItem,
                $currentContainer = this.$currentContainer,
                css = this.options.transitions ? 'scene__item scene__item--transitions' : 'scene__item'
            ;

            // 1. check if there is a sceneItem
            // 2. check it's not currently visible
            if ( !sceneItem || sceneItem === currentSceneItem ) {
                return;
            }

            // hide current
            if ( $currentContainer ) {
                $currentContainer.one( DOM_EVENTS.transitionEnd, function( e ) {
                    currentSceneItem.view.$el.detach();
                } );
                $currentContainer.attr( 'class', css + (back ? ' scene__item--next' : ' scene__item--previous') );
            }

            // show sceneItem
            this.currentSceneItem = sceneItem;
            this.$currentContainer = this.getNextContainer();

            // position the element at the starting position
            this.$currentContainer.attr( 'class', back ? 'scene__item scene__item--previous' : 'scene__item scene__item--next' );
            this.$currentContainer.append( sceneItem.view.el );

            // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
            var reflow = this.$currentContainer[0].offsetWidth;

            // show transitions immediately
            if ( this.options.initialTransition ) {
                this.showTransitions( this.options.transitions );
                // show transitions after first sceneItem is added
            } else {
                setTimeout( this.showTransitions, 0, this.options.transitions );
            }

            // transition the next page
            this.$currentContainer.attr( 'class', css + ' scene__item--current' );

            // append sceneItem to history
            if ( ! back ) {
                this.pushHistory( sceneItem );
            }

            // Trigger routing if specified
            if ( sceneItem.route ) {
                Backbone.history.navigate( sceneItem.route );
            }
        },
        pushHistory : function( sceneItem ) {
            this.history.splice( this.historyPosition + 1 );
            this.history.push( sceneItem );
            this.historyPosition = this.history.length - 1;
        },

        back : function() {
            var sceneItem,
                historyPosition = --this.historyPosition
                ;

            // Check if there's history to navigate
            if ( historyPosition < 0 ) {
                return false;
            }

            // Step back
            sceneItem = this.history[ historyPosition ];
            this.showSceneItem( sceneItem, true );

            return true;
        },

        showTransitions : function( yes ) {
            if ( yes === false ) {
                this.transitionsActive = false;
                this.$el.removeClass( 'scene--transitions' );
            } else {
                this.transitionsActive = true;
                this.$el.addClass( 'scene--transitions' );
            }
        },
        show            : function() {
            this.options.shown = true;
            this.$el
                .removeClass( 'scene--hide' )
                .addClass( 'scene--show' );
        },
        hide            : function() {
            this.options.shown = false;
            this.$el
                .removeClass( 'scene--show' )
                .addClass( 'scene--hide' );
        },
        toggle          : function() {
            if ( this.shown ) {
                this.hide();
            } else {
                this.show();
            }
        },

        // Event handlers

        /**
         * Scene 'transitionend' event handler
         *
         * @param {Event}  e
         */
        onTransitionEnd  : function( e ) {
            this.trigger( 'sceneTransitionEnd' );
        }

    } );

} );