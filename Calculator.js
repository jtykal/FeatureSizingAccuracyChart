Ext.define('Calculator', {

    config: {
        sizes: []
    },

    constructor: function (config) {
        this.initConfig(config);
    },

    prepareChartData: function (store) {
        var groupedData = this._groupData(store.getRange()),
            categories = this.sizes,
            groupedPlanEstimateTotals = _.transform(groupedData, function (result, pis, group) {
                result[group] = this._gatherTotals(pis);
            }, {}, this),
            totalsData = _.map(groupedPlanEstimateTotals, function (totals, key) {
                return [key, this._computePercentile(0.5, totals)];
            }, this),
            percentileData = _.map(groupedPlanEstimateTotals, function(totals) {
                return this._computePercentiles(totals);
            }, this);

        return {
            categories: categories,
            series: [
                {
                    name: 'Leaf Story Plan Estimate Total (Median)',
                    type: 'column',
                    data: totalsData
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

    _gatherTotals: function (pis) {
        return _.sortBy(_.map(pis, function (pi) {
            return pi.get('LeafStoryPlanEstimateTotal');
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
            return record.get('PreliminaryEstimate').Name;
        });
    }
});
