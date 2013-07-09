/**
 * SceneManager view
 *
 * @author Dave Taylor <dave.taylor@pogokid.com>
 * @author Robin North <robin@playnicely.co.uk>
 */

define( function( require ) {
    'use strict';

    var Backbone = require( 'backbone' ),
        DOM_EVENTS = require( 'helpers/dom_events' )
        ;

    return Backbone.View.extend( {

        attributes       : {
            class : 'scene'
        },
        defaults         : {
            container         : '<div class="scene__item" />',
            containersNumber  : 3,
            initialTransition : true,
            shown             : true,
            transitions       : true
        },

        initialize       : function() {

            // Init properties
            _.defaults( this.options, this.defaults );

            this.$currentContainer = null;
            this.currentSceneItem = null;
            this.currentSceneItemIndex = 0;
            this.containers = [];
            this.history = [];
            this.historyIndex = 0;
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
        render           : function() {

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
                nextSceneItem,
                $nextContainer,
                css = this.options.transitions && ( this.transitionsActive || this.options.initialTransition ) ? 'scene__item scene__item--transitions scene__item--transitioning' : 'scene__item'
                ;

            // 1. check if there is a sceneItem
            // 2. check it's not currently visible
            if ( !sceneItem || ( !_.isNull( currentSceneItem ) && sceneItem.view === currentSceneItem.view ) ) {
                return;
            }

            // hide current
            if ( $currentContainer ) {
                if ( this.options.transitions ) {
                    $currentContainer.one( DOM_EVENTS.transitionEnd, function( e ) {
                        currentSceneItem.view.$el.detach();
                        $currentContainer.removeClass( 'scene__item--transitioning' );
                    } );
                } else {
                    currentSceneItem.view.$el.detach();
                }
                $currentContainer.attr( 'class', css + (back ? ' scene__item--next' : ' scene__item--previous') );
            }

            // show sceneItem
            nextSceneItem = this.currentSceneItem = sceneItem;
            $nextContainer = this.$currentContainer = this.getNextContainer();

            $nextContainer.one( DOM_EVENTS.transitionEnd, function( e ) {
                $nextContainer.removeClass( 'scene__item--transitioning' );
            } );

            // position the element at the starting position
            $nextContainer.attr( 'class', back ? 'scene__item scene__item--previous' : 'scene__item scene__item--next' );
            $nextContainer.append( nextSceneItem.view.el );

            // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
            var reflow = $nextContainer[0].offsetWidth;

            // show transitions immediately
            if ( this.options.initialTransition ) {
                this.showTransitions( this.options.transitions );
                // show transitions after first sceneItem is added
            } else {
                setTimeout( this.showTransitions, 0, this.options.transitions );
            }

            // transition the next page
            $nextContainer.attr( 'class', css + ' scene__item--current' );

            // append sceneItem to history
            if ( !back ) {
                this.pushHistory( nextSceneItem );
            }

            // Trigger routing if specified
            if ( nextSceneItem.route ) {
                Backbone.history.navigate( nextSceneItem.route );
            }
        },
        hideSceneItem    : function() {
            var $currentContainer = this.$currentContainer,
                currentSceneItem = this.currentSceneItem,
                css = this.options.transitions ? 'scene__item scene__item--transitions scene__item--transitioning' : 'scene__item'
                ;

            // Check if there is a sceneItem
            if ( !currentSceneItem ) {
                return;
            }

            if ( this.options.transitions ) {
                $currentContainer.one( DOM_EVENTS.transitionEnd, function( e ) {
                    currentSceneItem.view.$el.detach();
                    $currentContainer.removeClass( 'scene__item--transitioning' );
                } );
            } else {
                currentSceneItem.view.$el.detach();
            }
            $currentContainer.attr( 'class', css );

            this.showTransitions( this.options.transitions );

            // Close current scene item
            $currentContainer.removeClass( 'scene__item--current' );

            // Reset scene state
            this.$currentContainer = null;
            this.currentSceneItem = null;
            this.currentSceneItemIndex = 0;
            this.history = [];
            this.historyIndex = 0;
        },
        pushHistory      : function( nextSceneItem ) {
            this.history.splice( this.historyIndex + 1 );
            this.history.push( nextSceneItem );
            this.historyIndex = this.history.length - 1;
        },
        back             : function() {
            var sceneItem,
                historyIndex = --this.historyIndex
                ;

            // Check if there's history to navigate
            if ( historyIndex < 0 ) {
                return false;
            }

            // Step back
            sceneItem = this.history[ historyIndex ];
            this.showSceneItem( sceneItem, true );

            return true;
        },
        showTransitions  : function( yes ) {
            if ( yes === false ) {
                this.$el.removeClass( 'scene--transitions scene--transitioning' );
                this.transitionsActive = false;
            } else {
                if ( this.transitionsActive || this.options.initialTransition ) {
                    this.$el.addClass( 'scene--transitions scene--transitioning' );
                } else {
                    this.$el.addClass( 'scene--transitions' );
                }
                this.transitionsActive = true;
            }
        },
        show             : function() {
            this.options.shown = true;
            this.$el
                .removeClass( 'scene--hide' )
                .addClass( 'scene--show' );
        },
        hide             : function() {
            this.options.shown = false;
            this.$el
                .removeClass( 'scene--show' )
                .addClass( 'scene--hide' );
        },
        toggle           : function() {
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
            this.$el.removeClass( 'scene--transitioning' );
        }

    } );

} );