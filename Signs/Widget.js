import { MixinBase } from '../Utility/Mixin';
import { EventEmitterMixin } from '../Utility/EventEmitterMixin';
import { $ } from '../../vendor/jquery';

/**
 * @typedef {Timeline.Slot} Widget.TimelineSlot
 * @property {null} params
 */

/**
 * Generic Widget
 * @class
 * @mixes EventEmitterMixin
 * @param {number} zoneId - ID of the Zone this widget is in
 * @param {number} displayId - ID of the Display this widget's Zone is in
 */
function Widget(zoneId, displayId) {
    /**
     * A list of the widget's metadata properties and values
     * @type {Object}
     */
    this.config = {};

    /**
     * @deprecated
     * @see Widget#customCssClass
     * @member {null|string} custom_css_class
     * @memberOf Widget
     * @instance
     */
    Object.defineProperty(this, 'custom_css_class', {
        get: function () {
            return this.customCssClass;
        },
        set: function (value) {
            this.customCssClass = value;
        },
    });

    /**
     * Property - boolean (true or false) returns true if the initialize
     * function has ran
     * @member {boolean} initialized
     * @memberOf Widget
     * @instance
     * @readonly
     */
    Object.defineProperty(this, 'initialized', {
        enumerable: true,
        get: function () {
            return this.state !== Widget.states.CREATED;
        },
    });

    /**
     * Property - boolean (true or false) to determine if widget is paused
     * @memberOf Widget
     * @member {boolean} isPaused
     * @instance
     * @readonly
     */
    Object.defineProperty(this, 'isPaused', {
        enumerable: true,
        get: function () {
            return this.state !== Widget.states.PLAYING;
        },
    });

    /**
     * Property from API - unique string used to attach class to DOM element
     * @type {null|string}
     */
    this.customCssClass = null;

    /**
     * Property from API - integer for loops per widget play
     * @type {null|number}
     */
    this.desaturation = null;

    /**
     * ID of the Display this widget's Zone is in
     * @deprecated
     * @type {number}
     */
    this.displayId = displayId;

    /**
     * Property from API - seconds to play widget
     * @type {number}
     */
    this.duration = 10;

    /**
     * Property from API - boolean (0 for false, 1 for true) determining if
     * widget should fill entire loop
     * @deprecated
     * @type {number}
     * @TODO refactor to boolean
     * @TODO rename to `isFiller`
     */
    this.filler = 0;

    /**
     * Property from API - ID of widget
     * @type {null|number}
     */
    this.id = null;

    /**
     * @deprecated
     * @see Widget#isPaused
     * @member {boolean} is_paused
     * @memberOf Widget
     * @instance
     */
    Object.defineProperty(this, 'is_paused', {
        get: function () {
            return this.isPaused;
        },
        set: function (value) {
            this.isPaused = value;
        },
    });

    /**
     * Property - integer count that is increased as widget is played which
     * helps determine desaturation
     * @deprecated
     * @type {number}
     */
    this.saturationCount = 0;

    /**
     * Property from API - Name of widget
     * @type {null|string}
     */
    this.name = null;

    /**
     * "name" property with escaped double quotes. Suitable to use with
     * handlebars
     * @type {null|string}
     */
    this.safeName = null;

    /**
     * Property from API - integer used to help timeline to determine the order
     * @type {number}
     */
    this.order = 0;

    /**
     * Property from API - integer, the higher the number, the more important to
     * play in timeline
     * @type {number}
     */
    this.priority = 0;

    /**
     * Property from API - boolean (0 for false, 1 for true) set to true if
     * widget should not play in order with other widgets in time
     * @type {number}
     * @TODO refactor to boolean
     */
    this.repellent = 0;

    /**
     * Property from API - boolean (0 for false, 1 for true) set to true if
     * widget should override other widgets in zone
     * @type {number}
     */
    this.override = 0;

    /**
     * Property from API - integer for widget plays per loop
     * @type {null|number}
     */
    this.saturation = null;

    /**
     * Property from API - String to indicate what kind of widget it is (e.g.
     * "graphic")
     * @type {null|string}
     */
    this.type = null;

    /**
     * Used to determine if there is any content available to display for a
     * given widget
     * @type {boolean}
     */
    this.hasContentToPlay = true;

    /**
     * Tells a time based timeline how many content slots to add for a loop (in
     * seconds)
     * @member {number} minimumLoopTime
     */
    this.minimumLoopTime = 10;

    /**
     * @deprecated
     * @see Widget#hasContentToPlay
     * @member {boolean} hasContent
     * @memberOf Widget
     * @instance
     */
    Object.defineProperty(this, 'hasContent', {
        get: function () {
            return this.hasContentToPlay;
        },
        set: function (value) {
            this.hasContentToPlay = value;
        },
    });

    /**
     * @deprecated
     * @see Widget#id
     * @member {null|number} widgetsid
     * @memberOf Widget
     * @instance
     */
    Object.defineProperty(this, 'widgetsid', {
        get: function () {
            return this.id;
        },
        set: function (value) {
            this.id = value;
        },
    });

    /**
     * @deprecated
     * @see Widget#name
     * @member {null|string} widgetsname
     * @memberOf Widget
     * @instance
     */
    Object.defineProperty(this, 'widgetsname', {
        get: function () {
            return this.name;
        },
        set: function (value) {
            this.name = value;
            this.safeName = value.replace(/"/g, '\\"');
        },
    });

    /**
     * Support old JSON style calls
     * @type {Widget}
     * @deprecated use variables/methods directly
     */
    this.widget = this;

    /**
     * Main DOM Element of the Widget
     * @type {null|HTMLElement}
     */
    this.wrapperElement = null;

    /**
     * ID of the Zone this widget is in
     * @deprecated
     * @type {number}
     */
    this.zoneId = zoneId;

    /**
     * Property from API - Object with CSS Template properties
     * @type {Object}
     */
    this.cssTemplates = {};

    /**
     * Stores slots used in a timeline loop
     * @type {Array.<Widget.TimelineSlot>}
     */
    this.timelineSlots = [];

    /**
     * Index to use to determine where to start adding content to timeline slots
     * @type {number}
     */
    this.contentStartIndex = 0;

    /**
     * The current state the the widget is in. All possible states are
     * in {@link Widget.states}.
     * @type {Widget.states}
     */
    this.state = Widget.states.CREATED;

    /**
     * If true the widget is in a broken and non-displayable state.
     * @type {boolean}
     */
    this.broken = false;
}

Widget.prototype = Object.create(EventEmitterMixin(MixinBase).prototype);
Widget.prototype.constructor = Widget;

/**
 * Represents an enumeration of the possible widget states
 * @static
 * @enum {number}
 * @readonly
 */
Widget.states = {
    CREATED: 0,
    STOPPED: 1,
    PLAYING: 2,
    PAUSED: 3,
};

/**
 * Check if given value is not empty
 * @param {*} val
 * @return {boolean}
 * @static
 */
Widget.valueNotEmpty = function (val) {
    if (typeof val === 'undefined' || val == '' || null == val) {
        return false;
    } else {
        return true;
    }
};

/**
 * Add property to `config` variable
 * @param {string} property
 * @param {*} value
 */
Widget.prototype.addConfigurationMetadata = function (property, value) {
    this.config[property] = value;
};

/**
 * triggered once fade in of widget is complete
 * @param {Widget.TimelineSlot} currentSlot
 * @param {Timeline.Slot} previousSlot
 * @returns {Promise.<(undefined|Widget~FadeIn)>}
 */
// eslint-disable-next-line no-unused-vars
Widget.prototype.afterFadeIn = function (currentSlot, previousSlot) {
    return Promise.resolve();
};

/**
 * triggered once fade out of widget is complete
 * @param {Widget.TimelineSlot} currentSlot
 * @param {Timeline.Slot} nextSlot
 * @returns {Promise}
 */
// eslint-disable-next-line no-unused-vars
Widget.prototype.afterFadeOut = function (currentSlot, nextSlot) {
    return Promise.resolve();
};

/**
 * triggered before fade in occurs
 * @param {Widget.TimelineSlot} currentSlot
 * @param {Timeline.Slot} previousSlot - previous slot that played in timeline
 * @param {Timeline} timeline - used to abort loop if needed
 * @returns {Promise.<(undefined|Widget~FadeIn)>}
 */
// eslint-disable-next-line no-unused-vars
Widget.prototype.beforeFadeIn = function (currentSlot, previousSlot, timeline) {
    return Promise.resolve();
};

/**
 * triggered before fade out occurs
 * @param {Widget.TimelineSlot} currentSlot
 * @param {Timeline.Slot} nextSlot - next slot in timeline - used to prepare
 * next slot if same widget (if announcements are current and next slot, DOM
 * element for next would populate and prep)
 * @returns {Promise.<(undefined|Widget~FadeOut)>}
 */
Widget.prototype.beforeFadeOut = function (currentSlot, nextSlot) {
    //cancel fade in/out if same widget
    return Promise.resolve({
        cancelFade: nextSlot && nextSlot.widget.id === currentSlot.widget.id,
    });
};

/**
 * used to potentially clear out template cache, used only in announcements
 */
Widget.prototype.clearCache = function () {};

/**
 * used to prepare next slot - only used in announcement
 * @param {Timeline.Slot} nextSlot
 */
// eslint-disable-next-line no-unused-vars
Widget.prototype.contentOnDeck = function (nextSlot) {
    return Promise.resolve();
};

/**
 * Create Main DOM Element of the Widget, store it in the
 * {@link Widget#wrapperElement} member, and attached it to the DOM
 * @param {HTMLElement} [parentElement]
 * @return {HTMLElement}
 */
Widget.prototype.createWrapperElement = function (parentElement) {
    var wrapperElement = document.createElement('div');

    wrapperElement.id = 'widget_' + this.id;

    wrapperElement.dataset.name = this.name;

    wrapperElement.classList.add('widget');
    wrapperElement.classList.add('widget-' + this.type);
    wrapperElement.classList.add(this.type); // DEPRECATED (use widget-{type})
    wrapperElement.classList.add('custom-' + this.type + '-' + this.customCssClass);

    // css overrides
    if (Widget.valueNotEmpty(this.config.width)) {
        wrapperElement.style.width = this.config.width + 'px';
    }
    if (Widget.valueNotEmpty(this.config.height)) {
        wrapperElement.style.height = this.config.height + 'px';
    }
    if (Widget.valueNotEmpty(this.config.z)) {
        wrapperElement.style.zIndex = this.config.z;
    }
    if (Widget.valueNotEmpty(this.config.x)) {
        wrapperElement.style.left = this.config.x + 'px';
    }
    if (Widget.valueNotEmpty(this.config.y)) {
        wrapperElement.style.top = this.config.y + 'px';
    }

    // user css
    if (Widget.valueNotEmpty(this.config.css)) {
        wrapperElement.setAttribute(
            'style',
            wrapperElement.getAttribute('style') + ';' + this.config.css
        );
    }
    if (Widget.valueNotEmpty(this.config.gui_css)) {
        wrapperElement.setAttribute(
            'style',
            wrapperElement.getAttribute('style') + ';' + this.config.gui_css
        );
    }

    this.wrapperElement = wrapperElement;

    if (parentElement) {
        parentElement.appendChild(wrapperElement);
    }

    return wrapperElement;
};

/**
 * Initialize Widget. This should take the widget from the created state to the
 * stopped state. Should not initialize any DOM or audio at this time. Also,
 * should not download any needed data for the app to play (this can be done on
 * the contentOnDeck function). This can be used to create internal variables,
 * timers, events, etc. and to check if the content is playable on the current
 * platform (if not, set the state to degraded). Should try to set
 * hasContentToPlay. The only DOM element that can be created here is the widget
 * wrapper element.
 */
Widget.prototype.initialize = function () {
    return Promise.resolve().then(
        function () {
            var zoneElement = document.getElementById('zone_' + this.zoneId);
            this.createWrapperElement(zoneElement);
            this.setEventEmitterElement(() => this.wrapperElement);

            this.state = Widget.states.STOPPED;

            return Promise.resolve();
        }.bind(this)
    );
};

/**
 * Pauses widget and sets state to paused. To prevent issues with rendering
 * content, a widget will only go to the PAUSED state directly from the
 * PLAYING state. When in the PAUSED state, the widget is not playing any
 * animations, or sounds. It can still be on the dom at this point.
 *
 * @param {Widget.TimelineSlot} currentSlot
 * @returns {Promise<void>}
 */
Widget.prototype.pause = async function (currentSlot) {
    if (this.state === Widget.states.PLAYING) {
        this.state = Widget.states.PAUSED;
        await this._doPause(currentSlot);
    }
};

/**
 * By default this does nothing. If needed, the individual widget should
 * override this function to pause any animations or background tasks that are
 * running.
 *
 * @param {Widget.TimelineSlot} currentSlot
 * @returns {Promise<void>}
 * @protected
 */
// eslint-disable-next-line no-unused-vars
Widget.prototype._doPause = function (currentSlot) {
    // this method intentionally left blank - DO NOT add code here
    return Promise.resolve();
};

/**
 * By default this does nothing. If needed, the individual widget should overide
 * this function to start getting the visuals ready to either be displayed on
 * pause or to be played. Either way this is where we initialize the basic
 * necessary DOM elements of the widget. Only gets ran if the widget is coming
 * from the STOPPED state.
 * @param {Widget.TimelineSlot} currentSlot
 * @returns {Promise}
 */
// eslint-disable-next-line no-unused-vars
Widget.prototype.getReadyForDisplay = function (currentSlot) {
    // this method intentionally left blank - DO NOT add code here
    return Promise.resolve();
};

/**
 * Starts playing content on the widget that requires sound, animations, and/or
 * visuals.
 * @param {Widget.TimelineSlot} currentSlot
 * @returns {Promise}
 */
// eslint-disable-next-line no-unused-vars
Widget.prototype.play = function (currentSlot) {
    return Promise.resolve().then(
        function () {
            this.state = Widget.states.PLAYING;

            return Promise.resolve();
        }.bind(this)
    );
};

/**
 * All dom elements of the widget should be removed from the zone at this point.
 * No animations or sounds should be playing anywhere either. Timers and history
 * of progress should be stopped and reset at this time.
 */
Widget.prototype.stop = function () {
    return Promise.resolve().then(
        function () {
            $(this.wrapperElement).empty();

            this.state = Widget.states.STOPPED;

            return Promise.resolve();
        }.bind(this)
    );
};

/**
 * @see Widget#getSlots
 * @deprecated
 */
Widget.prototype.getSlots = function (numSlots, maxDuration) {
    return this.querySlots.call(this, numSlots, maxDuration);
};

/**
 * @see Widget#getContent
 */
Widget.prototype.getContent = function (timeBased) {
    return this.queryContent.call(this, timeBased);
};

/**
 * determines slots to send to timeline
 * @param {number} numSlots - maximum number of slots
 * @param {number} maxDuration - time left in loop
 * @return {Array.<Widget.TimelineSlot>} slots
 */
Widget.prototype.querySlots = function (numSlots, maxDuration) {
    var slots = [];
    for (var i = 0; i < numSlots; ++i) {
        if (this.duration < maxDuration) {
            let slot = this.generateSlot(this.duration);
            slots.push(slot);

            maxDuration -= this.duration;
        } else {
            break;
        }
    }

    return slots;
};

/**
 * determines slots to send to timeline
 * @return {Array.<Widget.TimelineSlot>} slots
 */
Widget.prototype.queryContent = function () {
    let slot = this.generateSlot(this.duration);
    this.timelineSlots = [slot];

    return this.timelineSlots;
};

/**
 * Build a timeline slot
 * @param {number} duration
 * @param {Object<string, *> } [params]
 * @param {string|number} [groupId]
 * @return {Slot}
 */
Widget.prototype.generateSlot = function (duration, params, groupId) {
    return {
        widget: this,
        duration: duration,
        params: params || null,
        groupIdentifier: groupId ? this.generateGroupIdentifier(groupId) : null,
    };
};

/**
 * Returns a standardized groupIdentifier, used to group slots
 * @param {string|number} groupId
 * @return {string}
 */
Widget.prototype.generateGroupIdentifier = function (groupId) {
    return 'widget_' + this.id + '_' + this.safeName + '_group_' + groupId;
};

/**
 * Rechecks if a widget now has content to play
 * @return {Promise<boolean>} hasContentToPlay
 */
Widget.prototype.recheckForContent = function () {
    return Promise.resolve(this.hasContentToPlay);
};

export { Widget };
