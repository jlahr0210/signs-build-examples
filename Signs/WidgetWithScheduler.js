import { Widget } from '.';
import { Scheduler } from '../Utility/Scheduler';

/**
 * Widget with Scheduler
 * @class
 * @augments Widget
 */
function WidgetWithScheduler(zoneId, displayId) {
    Widget.call(this, zoneId, displayId);

    /**
     * Name of this widget's Scheduler
     * @type {null|string}
     */
    this.schedulerName = null;

    /**
     * Number of seconds between each time the `Scheduler` runs
     * @type {number}
     */
    this.schedulerRunInterval = 900; //15 minutes

    /**
     * Handler used to Pause/Resume Scheduler
     * @type {null|Scheduler}
     */
    this.schedulerHandle = null;
}

WidgetWithScheduler.prototype = Object.create(Widget.prototype);
WidgetWithScheduler.prototype.constructor = WidgetWithScheduler;

/**
 * @inheritdoc
 */
WidgetWithScheduler.prototype.initialize = function () {
    return Promise.resolve().then(
        function () {
            this.schedulerName = 'get_' + this.type + '_' + this.id;

            return Widget.prototype.initialize.apply(this, arguments);
        }.bind(this)
    );
};

/**
 * @inheritdoc
 */
WidgetWithScheduler.prototype.pause = async function () {
    if (this.state === Widget.states.PLAYING) {
        this.pauseScheduler();
    }
    await Widget.prototype.pause.apply(this, arguments);
};

/**
 * @inheritdoc
 */
WidgetWithScheduler.prototype.play = function () {
    return Promise.resolve().then(
        function () {
            this.startScheduler();

            return Widget.prototype.play.apply(this, arguments);
        }.bind(this)
    );
};

/**
 * @inheritdoc
 */
WidgetWithScheduler.prototype.stop = function () {
    return Promise.resolve().then(
        function () {
            this.stopScheduler();

            return Widget.prototype.stop.apply(this, arguments);
        }.bind(this)
    );
};

/**
 * Scheduler Action
 * @abstract
 */
WidgetWithScheduler.prototype.schedulerAction = function () {
    throw new Error('not implemented');
};

/**
 * Start Scheduler that updates widget content
 */
WidgetWithScheduler.prototype.startScheduler = function () {
    if (this.schedulerHandle) {
        this.schedulerHandle.Resume();
    } else {
        this.schedulerHandle = Scheduler.New()
            .Called(this.schedulerName)
            .HasAction(this.schedulerAction.bind(this))
            .RunEvery(this.schedulerRunInterval, 'seconds');
    }
};

/**
 * Pause Scheduler that updates widget content
 */
WidgetWithScheduler.prototype.pauseScheduler = function () {
    if (this.schedulerHandle) {
        this.schedulerHandle.Pause();
    }
};

/**
 * Stop Scheduler that updates widget content
 */
WidgetWithScheduler.prototype.stopScheduler = function () {
    Scheduler.Delete(this.schedulerName);
    this.schedulerHandle = null;
};

export { WidgetWithScheduler };
