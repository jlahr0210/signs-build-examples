import { Log } from '../AuxillaryService/Log';
import {
    Widget,
    AdWidget,
    AnnouncementWidget,
    ContentWidget,
    CustomHtmlWidget,
    GraphicWidget,
    IframeWidget,
    LabelWidget,
    ListWidget,
    MapsWidget,
    SocialMedallionWidget,
    PowerBIWidget,
    ScheduleWidget,
    ScoresWidget,
    TickerWidget,
    TimeDateWidget,
    VideoStreamWidget,
    WeatherWidget,
    CounterWidget,
    RadarWidget,
    QuoteWidget,
} from '.';

/**
 * Widget Factory
 * @class
 */
function WidgetFactory() {
    /**
     * Create Widget
     * @method
     * @param {object} apiResults
     * @param {string} apiResults.css_templates
     * @param {object} apiResults.config
     * @param {string} apiResults.custom_css_class
     * @param {null|number} [apiResults.desaturation]
     * @param {number} apiResults.duration
     * @param {number} apiResults.filler - (TODO: refactor to boolean)
     * @param {number} [apiResults.locked] - (TODO: refactor to boolean) (TODO:
     * this is not used, remove it)
     * @param {number} apiResults.order
     * @param {number} apiResults.priority
     * @param {number} apiResults.repellent - (TODO: refactor to boolean)
     * @param {number} apiResults.override
     * @param {number} apiResults.saturation
     * @param {string} apiResults.type
     * @param {number} apiResults.widgetsid
     * @param {string} apiResults.widgetsname
     * @param {string} apiResults.minimum_loop_time
     * @param {number} zoneId
     * @param {number} displayId
     * @return {Widget}
     */
    this.createWidget = function (apiResults, zoneId, displayId) {
        var type = apiResults.type || 'general';

        var widget;
        var widgetClass = this.getWidgetClass(type);

        if (widgetClass !== null) {
            widget = new widgetClass(zoneId, displayId);
        } else {
            Log.Error(
                `The widget type '${type}' is unknown, falling back to base widget class.`,
                null,
                __fileline
            );
            widget = new Widget(zoneId, displayId);
        }

        //<editor-fold desc="populate widget">
        if (apiResults.css_templates && typeof apiResults.css_templates !== 'undefined') {
            widget.cssTemplates = JSON.parse(apiResults.css_templates);
        }

        if (typeof apiResults.custom_css_class !== 'undefined') {
            widget.customCssClass = apiResults.custom_css_class;
        }
        if (typeof apiResults.desaturation !== 'undefined' && apiResults.desaturation !== null) {
            widget.desaturation = apiResults.desaturation;
        }

        if (typeof apiResults.duration !== 'undefined') {
            widget.duration = apiResults.duration;
        }

        if (typeof apiResults.filler !== 'undefined') {
            widget.filler = apiResults.filler;
            //widget.isFiller = Boolean(apiResults.filler);
        }

        if (typeof apiResults.order !== 'undefined') {
            widget.order = apiResults.order;
        }

        if (typeof apiResults.priority !== 'undefined') {
            widget.priority = apiResults.priority;
        }

        if (typeof apiResults.repellent !== 'undefined') {
            widget.repellent = apiResults.repellent;
            //widget.repellent = Boolean(apiResults.repellent);
        }

        if (typeof apiResults.override !== 'undefined') {
            widget.override = apiResults.override;
        }

        if (typeof apiResults.saturation !== 'undefined') {
            widget.saturation = apiResults.saturation;
        }

        // TODO: remove when not needed
        if (typeof apiResults.type !== 'undefined' && widget.type == null) {
            widget.type = apiResults.type;
        }

        if (typeof apiResults.widgetsid !== 'undefined') {
            widget.id = apiResults.widgetsid;
        }

        if (typeof apiResults.widgetsname !== 'undefined') {
            widget.name = apiResults.widgetsname;
            widget.safeName = widget.name.replace(/"/g, '\\"');
        }

        if (typeof apiResults.minimum_loop_time !== 'undefined') {
            widget.minimumLoopTime = apiResults.minimum_loop_time;
        }

        for (var prop in apiResults.config) {
            widget.addConfigurationMetadata(prop, apiResults.config[prop]);
        }
        //</editor-fold desc="populate widget">

        // Initialize Widget
        try {
            widget.initialize().catch(function (e) {
                Log.Error(
                    'Failed to initialize ' + widget.type + ' widget: ' + widget.name,
                    null,
                    __fileline,
                    { error: e.toString() }
                );
            });
        } catch (e) {
            Log.Error(
                'Failed to initialize ' + widget.type + ' widget: ' + widget.name,
                null,
                __fileline,
                { error: e.toString() }
            );
        }

        return widget;
    };

    /**
     * Return class constructor for a given widget type
     * @method
     * @param {string} type
     * @return {null|object}
     */
    this.getWidgetClass = function (type) {
        var widgetClass;

        if (type === 'ad') {
            widgetClass = AdWidget;
        } else if (type === 'announcement') {
            widgetClass = AnnouncementWidget;
        } else if (type === 'content') {
            widgetClass = ContentWidget;
        } else if (type === 'customhtml') {
            widgetClass = CustomHtmlWidget;
        } else if (type === 'graphic') {
            widgetClass = GraphicWidget;
        } else if (type === 'iframe') {
            widgetClass = IframeWidget;
        } else if (type === 'iframepremium') {
            widgetClass = IframeWidget;
        } else if (type === 'label') {
            widgetClass = LabelWidget;
        } else if (type === 'list') {
            widgetClass = ListWidget;
        } else if (type === 'maps') {
            widgetClass = MapsWidget;
        } else if (type === 'medallion') {
            widgetClass = SocialMedallionWidget;
        } else if (type === 'powerbi') {
            widgetClass = PowerBIWidget;
        } else if (type === 'schedule') {
            widgetClass = ScheduleWidget;
        } else if (type === 'scores') {
            widgetClass = ScoresWidget;
        } else if (type === 'ticker') {
            widgetClass = TickerWidget;
        } else if (type === 'timedate') {
            widgetClass = TimeDateWidget;
        } else if (type === 'video_stream') {
            widgetClass = VideoStreamWidget;
        } else if (type === 'weather') {
            widgetClass = WeatherWidget;
        } else if (type === 'counter') {
            widgetClass = CounterWidget;
        } else if (type === 'radar') {
            widgetClass = RadarWidget;
        } else if (type === 'quote') {
            widgetClass = QuoteWidget;
        } else {
            widgetClass = null;
        }

        return widgetClass;
    };
}

/**
 * @return {WidgetFactory}
 */
function widgetFactory() {
    // To call constructor's without `new`, you might do this:
    return new WidgetFactory();
}

export { widgetFactory };
