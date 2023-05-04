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
            minmaxData = _.map(groupedPlanEstimateTotals, function(totals) {
                return this._computeMinMax(totals);
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
                    name: 'min - max',
                    type: 'errorbar',
                    data: minmaxData,
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

    _computeMinMax: function(totals) {
        var min = totals[0], 
            max = totals[totals.length-1];
        if (min === max) {
            return [];
        } else {
            return [min, max];
        }
    },

    _groupData: function (records) {
        return _.groupBy(records, function (record) {
            return record.get('PreliminaryEstimate').Name;
        });
    }
});
