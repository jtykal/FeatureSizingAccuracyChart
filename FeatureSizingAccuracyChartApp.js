Ext.define('FeatureSizingAccuracyChartApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',

    layout: 'fit',
    autoScroll: false,

    requires: [
        'Calculator'
    ],

    config: {
        defaultSettings: {
            query: ''
        }
    },

    getSettingsFields: function() {
        return [
            { type: 'query' }
        ];
    },

    launch: function () {
        Rally.data.wsapi.ModelFactory.getModel({
            type: 'PortfolioItem',
        }).then({
            success: this._onModelLoaded,
            scope: this
        });
    },

    _onModelLoaded: function (model) {
        this.model = model;
        this.piType = 'PortfolioItem/Feature';
        this._addChart();

    },

    _addChart: function () {
        var context = this.getContext(),
            whiteListFields = ['Milestones', 'Tags'],
            gridBoardConfig = {
                xtype: 'rallygridboard',
                toggleState: 'chart',
                chartConfig: this._getChartConfig(),
                plugins: [{
                    ptype: 'rallygridboardinlinefiltercontrol',
                    showInChartMode: true,
                    inlineFilterButtonConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('filters'),
                        filterChildren: false,
                        modelNames: ['portfolioitem/feature'],
                        inlineFilterPanelConfig: {
                            quickFilterPanelConfig: {
                                defaultFields: ['Release'],
                                addQuickFilterConfig: {
                                    whiteListFields: whiteListFields
                                }
                            },
                            advancedFilterPanelConfig: {
                                advancedFilterRowsConfig: {
                                    propertyFieldConfig: {
                                        whiteListFields: whiteListFields
                                    }
                                }
                            }
                        }
                    }
                }],
                context: context,
                modelNames: ['portfolioitem/feature'],
                storeConfig: {
                    filters: this._getFilters()
                }
            };
        this.add(gridBoardConfig);
    },

    _getChartConfig: function () {
        var config = {
            xtype: 'rallychart',
            chartColors: [
                "#FF8200", // $orange
                "#F6A900", // $gold
                "#FAD200", // $yellow
                "#8DC63F", // $lime
                "#1E7C00", // $green_dk
                "#337EC6", // $blue_link
                "#005EB8", // $blue
                "#7832A5", // $purple,
                "#DA1884",  // $pink,
                "#C0C0C0" // $grey4
            ],
            storeType: 'Rally.data.wsapi.Store',
            storeConfig: {
                context: this.getContext().getDataContext(),
                limit: Infinity,
                fetch: this._getChartFetch(),
                sorters: this._getChartSort(),
                pageSize: 2000,
                model: 'PortfolioItem/Feature'
            },
            calculatorType: 'Calculator',
            calculatorConfig: {
                sizes: this.sizes,
            },
            chartConfig: {
                chart: { type: 'column' },
                legend: { enabled: true },
                title: {
                    text: ''
                },
                yAxis: {
                    min: 0,
                    title: {
                        text: this.getContext().getWorkspace().WorkspaceConfiguration.ReleaseEstimateUnitName
                    }
                },
                plotOptions: {
                    column: {
                        dataLabels: {
                            enabled: false
                        },
                        colorByPoint: true
                    }
                }
            }
        };
        return config;
    },

    onTimeboxScopeChange: function () {
        this.callParent(arguments);

        var gridBoard = this.down('rallygridboard');
        if (gridBoard) {
            gridBoard.destroy();
        }
        this._addChart();
    },

    _getChartFetch: function () {
        return ['PreliminaryEstimate', 'Name', 'Value', 'LeafStoryPlanEstimateTotal', 'Release'];
    },

    _getChartSort: function () {
        return [{ property: 'PreliminaryEstimateValue', direction: 'ASC' }];
    },

    _getFilters: function () {
        var queries = [{
            property: 'PreliminaryEstimate',
            operator: '!=',
            value: null
        }];

        var timeboxScope = this.getContext().getTimeboxScope();
        if (timeboxScope && timeboxScope.isApplicable(this.model)) {
            queries.push(timeboxScope.getQueryFilter());
        }
        if (this.getSetting('query')) {
            // queries.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
            // Above line replaced with the two below (from CustomChart app) - no change
            var querySetting = this.getSetting('query').replace(/\{user\}/g, this.getContext().getUser()._ref);
            queries.push(Rally.data.QueryFilter.fromQueryString(querySetting));
        }
        return queries;
    }
});
