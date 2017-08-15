Ext.define('Calculator', {

    config: {
        sizes: []
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    prepareChartData: function (store) {
        var groupedData = this._groupData(store.getRange()),
            categories = _.keys(groupedData),
            groupedCycleTimes = _.transform(groupedData, function (result, pis, group) {
                result[group] = this._computeCycleTimes(pis);
            }, {}, this),
            cycleTimeData = _.map(groupedCycleTimes, function (cycleTimes, key) {
                return [key, this._computePercentile(0.5, cycleTimes)];
            }, this),
            percentileData = _.map(groupedCycleTimes, function(cycleTimes) {
                return this._computePercentiles(cycleTimes);
            }, this);

        return {
            categories: categories,
            series: [
                {
                    name: 'Cycle Time (Median)',
                    type: 'column',
                    data: cycleTimeData
                },
                {
                    name: 'P25 - P75',
                    type: 'errorbar',
                    data: percentileData,
                    showInLegend: true
                }
            ]
        };
    },

    _computeCycleTimes: function (pis) {
        return _.sortBy(_.map(pis, function (pi) {
            var startDate = pi.get('ActualStartDate'),
                endDate = pi.get('ActualEndDate');
            return moment(endDate).diff(moment(startDate), 'days');
        }));
    },

    _computePercentiles: function(cycleTimes) {
        var p25 = this._computePercentile(0.25, cycleTimes), 
            p75 = this._computePercentile(0.75, cycleTimes);

        if (p25 === p75) {
            return [];
        } else {
            return [p25, p75];
        }
    },

    _computePercentile: function (p, cycleTimes) {
        var index = p * cycleTimes.length,
            floorIndex = Math.floor(index);

        if (cycleTimes.length === 1) {
            return cycleTimes[0];
        } else if(floorIndex === index) {
            return (cycleTimes[floorIndex] + cycleTimes[floorIndex - 1]) / 2;
        } else {
            return cycleTimes[floorIndex];
        }
    },

    _groupData: function (records) {
        return _.groupBy(records, function (record) {
            var endDate = record.get('ActualEndDate');
            if (this.bucketBy === 'month') {
                return moment(endDate).startOf('month').format('MMM \'YY');
            } else if (this.bucketBy === 'quarter') {
                return moment(endDate).startOf('quarter').format('YYYY [Q]Q');
            } else if (this.bucketBy === 'release') {
                return record.get('Release')._refObjectName;
            } else if (this.bucketBy === 'year') {
                return moment(endDate).startOf('year').format('YYYY');
            }
        }, this);
    },
});
