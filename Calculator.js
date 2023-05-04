Ext.define('Calculator', {

    prepareChartData: function (store) {
        var groupedData = this._groupData(store.getRange()),
            categories = _.keys(groupedData),
            groupedPlanEstimateTotals = _.transform(groupedData, function (result, pis, group) {
                result[group] = this._gatherTotals(pis);
            }, {}, this),
            totalsData = _.map(groupedPlanEstimateTotals, function (totals, key) {
                return [key, this._computeMean(totals)];
            }, this),
            percentileData = _.map(groupedPlanEstimateTotals, function(totals) {
                return this._computePercentiles(totals);
            }, this);

        return {
            categories: categories,
            series: [
                {
                    name: 'Leaf Story Plan Estimate Total (Mean)',
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

    _computeMean: function(totals) {
        var total = _.reduce(totals, function(accum, val) {
            return accum + val;
        }, 0);
        return Math.round(total / totals.length);
    },

    _gatherTotals: function (pis) {
        return _.sortBy(_.map(pis, function (pi) {
            return pi.get('LeafStoryPlanEstimateTotal');
        }));
    },

    _computePercentiles: function(totals) {
        var p25 = this._computePercentile(0.25, totals), 
            p75 = this._computePercentile(0.75, totals);

        if (p25 === p75) {
            return [];
        } else {
            return [p25, p75];
        }
    },

    _computePercentile: function (p, totals) {
        var index = p * totals.length,
            floorIndex = Math.floor(index);

        if (totals.length === 1) {
            return totals[0];
        } else if(floorIndex === index) {
            return (totals[floorIndex] + totals[floorIndex - 1]) / 2;
        } else {
            return totals[floorIndex];
        }
    },

    _groupData: function (records) {
        return _.groupBy(records, function (record) {
            return record.get('PreliminaryEstimate').Name;
        });
    }
});