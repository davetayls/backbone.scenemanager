
define(function(require, exports, module){
    'use strict';

    var Backbone = require('backbone'),
        DOM_EVENTS = require('utils/dom_events')
    ;

    module.exports = Backbone.View.extend({


        initialize: function(){
            _.bindAll(this, 'showTransitions');
            this.shown = true;
            this.$current = null;
            this.currentView = null;
            this.currentIndex = 0;
            this.containers = [
                $(document.createElement('div')),
                $(document.createElement('div')),
                $(document.createElement('div'))
            ];
            this.history = [];
        },
        render: function(){
            if (this.shown){
                this.show();
            } else {
                this.hide();
            }
            _.each(this.containers, function($el, i){
                this.$el.append($el);
            }, this);
        },

        getNextIndex: function(){
            if (this.currentIndex +1 >= this.containers.length){
                return 0;
            } else {
                return this.currentIndex +1;
            }
        },
        getNextContainer: function(){
            this.currentIndex = this.getNextIndex();
            return this.containers[this.currentIndex];
        },

        showView: function(view, back){
            // cache pointers so we can do this async
            var currentView = this.currentView,
                $current    = this.$current,
                css         = this.transitions ? 'scene transitions' : 'scene'
            ;

            // 1. check if there is a view
            // 2. check it's not currently visible
            if (!view || view === currentView){
                return;
            }

            // hide current
            if ($current){
                $current.one(DOM_EVENTS.transitionEnd, function(e){
                    currentView.$el.detach();
                });
                $current.attr('class', css+ (back ? ' next' : ' previous'));
            }

            // show view
            this.currentView = view;
            this.$current = this.getNextContainer();

            // position the element at the starting position
            this.$current.attr('class', back ? 'scene previous' : 'scene next');
            this.$current.append(view.el);

            // Force reflow. More information here: http://www.phpied.com/rendering-repaint-reflowrelayout-restyle/
            var reflow = this.$current[0].offsetWidth;

            // transition the next page
            this.$current.attr('class', css+ ' current');

            // show transitions after first view is added
            setTimeout(this.showTransitions, 0);

            // append view to history
            if (!back){
                this.pushHistory(view);
            }
        },
        pushHistory: function(view){
            this.history.splice(this.historyPosition+1);
            this.history.push(view);
            this.historyPosition = this.history.length-1;
        },

        back: function(){
            this.historyPosition--;
            this.showView(this.history[this.historyPosition], true);
        },

        showTransitions: function(yes){
            if (yes === false){
                this.transitions = false;
                this.$el.removeClass('scene--transitions');
            } else {
                this.transitions = true;
                this.$el.addClass('scene--transitions');
            }
        },
        show: function(){
            this.shown = true;
            this.$el
                .removeClass('scene--hide')
                .addClass('scene--show');
        },
        hide: function(){
            this.shown = false;
            this.$el
                .removeClass('scene--show')
                .addClass('scene--hide');
        },
        toggle: function(){
            if (this.shown){
                this.hide();
            } else {
                this.show();
            }
        }

    });

});