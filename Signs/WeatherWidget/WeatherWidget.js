import { WidgetWithScheduler } from '../WidgetWithScheduler';
import { Signage } from '../../Signage';
import { Log } from '../../AuxillaryService/Log';
import { ReachAPI } from '../../ReachApi';
import { TemplateWidgetMixin } from '../../Template';
import { moment } from '../../../vendor/moment';

/**
 * Converts temperatures in Celsius to a different temperature scale.
 * @param {number} tempInC - temperature in Celsius
 * @param {string} toScale - the scale to convert to (eg. fahrenheit, kelvin,
 * etc.)
 * @returns {number|undefined} - returns undefined if scale is unknown
 * @inner
 */
function convertTemperature(tempInC, toScale) {
    switch (toScale.toLowerCase()) {
        case 'fahrenheit':
        case 'f':
            return tempInC * (9 / 5) + 32;
        case 'centigrade':
        case 'celsius':
        case 'c':
            return tempInC;
        case 'kelvin':
        case 'k':
            return tempInC + 273.15;
        case 'rankine':
            return (tempInC + 273.15) * (9 / 5);
        case 'delisle':
            return (100 - tempInC) * 1.5;
        case 'newton':
            return tempInC * (33 / 100);
        case 'réaumur':
            return tempInC * 0.8;
        case 'rømer':
        case 'roemer':
            return tempInC * (21 / 40) + 7.5;
    }
}

/**
 * Weather Widget
 * @class
 * @augments WidgetWithScheduler
 * @mixes TemplateWidgetMixin
 */
function WeatherWidget(zoneId, displayId) {
    WidgetWithScheduler.call(this, zoneId, displayId);

    /**
     * @type {string}
     */
    this.type = 'weather';

    /**
     * Number of seconds between each time the `Scheduler` runs
     * @type {number}
     */
    this.schedulerRunInterval = 2820; //47 minutes (2820 seconds)

    this.lastUpdate = null;
}

WeatherWidget.prototype = Object.create(WidgetWithScheduler.prototype);
TemplateWidgetMixin.call(WeatherWidget.prototype);
WeatherWidget.prototype.constructor = WeatherWidget;

/**
 * @listens MessagingClient#weather-update
 */
WeatherWidget.prototype.initialize = function () {
    return Promise.resolve().then(() => {
        Signage.messagingClient?.addListener('weather-update', (event) => {
            if (event.detail.location === this.config.zip) {
                Log.Info(
                    `Received push notification from MessagingClient for weather location "${event.detail.location}"`,
                    null,
                    __fileline
                );

                this._updateComponentWithApiData().then();
            }
        });

        //NOTE: "zip" may not actually be amenable to channel
        //      nomenclature (e.g. Cape Girardeau) we need to figure out
        //      what to do about that. one option would be to use the
        //      database ID instead of the location_id... this would
        //      require a call to the API to get the database ID
        Signage.messagingClient
            ?.subscribeToWeather(this.config.zip)
            .then(() => {
                Log.Debug(
                    'Weather Widget Subscribed. widgetsid=' + this.id + ', zip=' + this.config.zip,
                    null,
                    __fileline
                );
            })
            .catch((error) => {
                //failure!
                Log.Error(
                    'Failed to subscribe to channel ' + this.widget.zip,
                    null,
                    __fileline,
                    error
                );
            });

        return WidgetWithScheduler.prototype.initialize.call(this);
    });
};

/**
 * @inheritdoc
 */
WeatherWidget.prototype.getReadyForDisplay = async function () {
    await this._updateComponentWithApiData();
};

/**
 * Get the weather icon based on icon and version
 * @param {string} icon - name of icon to use
 * @param {string} version - Version of icon to be used
 * @return {string} iconImage
 */
WeatherWidget.getWeatherIcon = function (icon, version) {
    var v = null !== version ? version + '/' : '';
    var iconImage = '/images/weather_icon/' + v + icon + '.png';
    return iconImage;
};

/**
 * Get the weather background based on condition and version
 * @param {string} condition - name of the weather condition
 * @return {string} backgroundImage
 */
WeatherWidget.getWeatherBackground = function (condition) {
    var backgroundImage = '/images/weather_background/v1/' + condition + '.png';
    return backgroundImage;
};

/**
 * Get the weather day name from a unix timestamp
 * @param {string} timestamp
 * @return {string} dayName
 */
WeatherWidget.dayNameFromUnixTimestamp = function (timestamp) {
    var momentDate = moment.unix(timestamp);
    var dayName = momentDate.tz(Signage.localTimeZone).format('ddd');
    return dayName;
};

/**
 * Updates and parses all of the weather data
 * @param {object} json containing all the current and forecast weather data
 * (see API documentation for endpoint [/weather]
 */
WeatherWidget.prototype._updateComponent = function (json) {
    var temperatureUnits =
        /\?.*temperature-scale-([a-zøé]+).*/.exec(window.location.href) ||
        this.widget.config.temperature_scale ||
        'f';
    var conv = function (temp) {
        return Math.round(convertTemperature(temp, temperatureUnits));
    };

    //always use the bang-bang when possible
    this.hasContentToPlay = !!this.widget.config.zip && json;

    this.lastUpdate = Date.now();

    if (this.hasContentToPlay) {
        var weatherData = json.weather;
        var weather = {};
        var hourly = [];

        weather.weather_locality_id =
            weatherData.current.length > 0 ? weatherData.current[0].weather_locality_id : null;
        weather.currday_temp =
            weatherData.current.length > 0 ? conv(weatherData.current[0].temperature) : null;
        weather.locality = weatherData.current.length > 0 ? weatherData.current[0].locality : null;
        weather.area = weatherData.current.length > 0 ? weatherData.current[0].area : null;
        weather.description =
            weatherData.current.length > 0 ? weatherData.current[0].description : null;
        weather.condition =
            weatherData.current.length > 0 ? weatherData.current[0].condition : null;
        weather.currday_icon =
            weatherData.current.length > 0
                ? WeatherWidget.getWeatherIcon(
                      weatherData.current[0].icon,
                      this.widget.config.icon_version
                  )
                : '/images/weather_icon/na.png';
        weather.currday_background =
            weatherData.current.length > 0
                ? WeatherWidget.getWeatherBackground(weatherData.current[0].icon)
                : null;
        weather.wind_speed =
            weatherData.current.length > 0 ? weatherData.current[0].wind_speed : null;
        weather.wind_direction_icon =
            weatherData.current.length > 0 ? '/images/weather_icon/wind/wind_dir2.png' : null;
        weather.wind_direction =
            weatherData.current.length > 0 ? weatherData.current[0].wind_direction : null;
        weather.feels_like =
            weatherData.current.length > 0 ? conv(weatherData.current[0].feels_like) : null;

        weather.today_hi =
            weatherData.forecast.length > 0 ? conv(weatherData.forecast[0].temp_high) : null;
        weather.today_low =
            weatherData.forecast.length > 0 ? conv(weatherData.forecast[0].temp_low) : null;
        weather.today_condition =
            weatherData.forecast.length > 0 ? weatherData.forecast[0].condition : null;
        weather.tomorrow_day =
            weatherData.forecast.length > 0
                ? WeatherWidget.dayNameFromUnixTimestamp(weatherData.forecast[1].timestamp)
                : null;
        weather.tomorrow_hi =
            weatherData.forecast.length > 0 ? conv(weatherData.forecast[1].temp_high) : null;
        weather.tomorrow_low =
            weatherData.forecast.length > 0 ? conv(weatherData.forecast[1].temp_low) : null;
        weather.tomorrow_condition =
            weatherData.forecast.length > 0 ? weatherData.forecast[1].condition : null;
        weather.tomorrow_icon =
            weatherData.forecast.length > 0
                ? WeatherWidget.getWeatherIcon(
                      weatherData.forecast[1].icon,
                      this.widget.config.icon_version
                  )
                : '/images/weather_icon/na.png';
        weather.tomorrow_feels_like =
            weatherData.forecast.length > 0 ? conv(weatherData.forecast[1].feels_like) : null;

        for (let i = 2; i < weatherData.forecast.length; i++) {
            weather['day' + i + '_day'] =
                weatherData.forecast.length > 0
                    ? WeatherWidget.dayNameFromUnixTimestamp(weatherData.forecast[i].timestamp)
                    : null;
            weather['day' + i + '_hi'] =
                weatherData.forecast.length > 0 ? conv(weatherData.forecast[i].temp_high) : null;
            weather['day' + i + '_low'] =
                weatherData.forecast.length > 0 ? conv(weatherData.forecast[i].temp_low) : null;
            weather['day' + i + '_condition'] =
                weatherData.forecast.length > 0 ? weatherData.forecast[i].condition : null;
            weather['day' + i + '_icon'] =
                weatherData.forecast.length > 0
                    ? WeatherWidget.getWeatherIcon(
                          weatherData.forecast[i].icon,
                          this.widget.config.icon_version
                      )
                    : null;
            weather['day' + i + '_feels_like'] =
                weatherData.forecast.length > 0 ? conv(weatherData.forecast[i].feels_like) : null;
        }

        if (weatherData.hourly && weatherData.hourly.length > 0) {
            for (let i = 0; i < weatherData.hourly.length; i++) {
                var hourObject = {};

                hourObject.day = WeatherWidget.dayNameFromUnixTimestamp(
                    weatherData.hourly[i].timestamp
                );
                hourObject.date = weatherData.hourly[i].date;
                hourObject.time = weatherData.hourly[i].time;
                hourObject.temp_high = conv(weatherData.hourly[i].temp_high);
                hourObject.temp_low = conv(weatherData.hourly[i].temp_low);
                hourObject.condition = weatherData.hourly[i].condition;
                hourObject.icon = WeatherWidget.getWeatherIcon(
                    weatherData.hourly[i].icon,
                    this.widget.config.icon_version
                );
                hourObject.feels_like = conv(weatherData.hourly[i].feels_like);
                hourly.push(hourObject);
            }
        }

        var context = {
            wid: this.id.toString(),
            wobj: this,
            Widget: { Id: this.widgetsid },
            weather: weather,
            hourly: hourly,
            lastUpdated: this.lastUpdate,
            landscape: this.getLayoutType() === 'landscape',
            portrait: this.getLayoutType() === 'portrait',
        };

        this.renderContent(context).catch(
            function (error) {
                Log.Error(
                    'Failed to render widget content (' + this.id + ':' + this.name + ')',
                    null,
                    __fileline,
                    error
                );
            }.bind(this)
        );
    }
};

/**
 * Update with weather data from the API
 * @returns {Promise<void>}
 */
WeatherWidget.prototype._updateComponentWithApiData = async function () {
    let json = await ReachAPI.weather.getWeather(this.widget.config.zip, 'c');
    this._updateComponent(json);
};

/**
 */
WeatherWidget.prototype.schedulerAction = function () {
    if (null === this.lastUpdate || this.lastUpdate < Date.now() - 1800000) {
        //has not updated from Mercury as expected.
        if (null != this.lastUpdate) {
            Log.Warning(
                'Weather widget is stale (' + this.id + ':' + this.name + '); will update from API',
                null,
                __fileline
            );
        }

        this._updateComponentWithApiData().then();
    }
};

/**
 * Returns layout type
 * @returns {('landscape'|'portrait')}
 */
WeatherWidget.prototype.getLayoutType = function () {
    if (this.wrapperElement.clientHeight > this.wrapperElement.clientWidth) {
        return 'portrait';
    }

    return 'landscape';
};

export { WeatherWidget };
