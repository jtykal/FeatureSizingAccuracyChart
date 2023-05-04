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
            success: this._loadMetadata,
            scope: this
        });
    },

    _getLowestLevelPI: function () {
        console.log('_getLowestLevelPI');
        return Ext.create('Rally.data.wsapi.Store', {
            model: 'TypeDefinition',
            filters: [
                { property: 'Creatable', value: true },
                { property: 'Parent.Name', value: 'Portfolio Item' },
                { property: 'Ordinal', value: 0 }
            ]
        }).load().then({
            success: function (records) {
                return records[0].get('TypePath');
            },
            scope: this
        });
    },

    _loadMetadata: function (model) {
        this.model = model;
        console.log('_loadMetadata:  this.model=',this.model);
        return this._getLowestLevelPI().then({
            success: this._onMetaRetrieved,
            scope: this
        });
    },

    _onMetaRetrieved: function (piType) {
        console.log('_onMetaRetrieved, piType=',piType);
        this.piType = piType;
        this._addChart();
    },

    _addChart: function () {
        console.log('_addChart');
        var context = this.getContext(),
            whiteListFields = ['Milestones', 'Tags'],
            //modelNames = [this.model.typePath],
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
        //console.log('_addChart, modelNames=',modelNames);
        this.add(gridBoardConfig);
    },

    _getChartConfig: function () {
        console.log('_getChartConfig');
        return {
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
    },

    onTimeboxScopeChange: function () {
        console.log('onTimeboxScopeChange');
        this.callParent(arguments);

        var gridBoard = this.down('rallygridboard');
        if (gridBoard) {
            gridBoard.destroy();
        }
        this._addChart();
    },

    _getChartFetch: function () {
        console.log('_getChartFetch');
        return ['PreliminaryEstimate', 'Name', 'Value', 'LeafStoryPlanEstimateTotal', 'Release'];
    },

    _getChartSort: function () {
        console.log('_getChartSort');
        return [{ property: 'PreliminaryEstimateValue', direction: 'ASC' }];
    },

    _getFilters: function () {
        console.log('_getFilters');
        var queries = [{
            property: 'PreliminaryEstimate',
            operator: '!=',
            value: null
        }];

        var timeboxScope = this.getContext().getTimeboxScope();
        console.log('timeboxScope is', timeboxScope);
        if (timeboxScope && timeboxScope.isApplicable(this.model)) {
            console.log('timeboxScope IS APPLICABLE');
            queries.push(timeboxScope.getQueryFilter());
        }
        if (this.getSetting('query')) {
            queries.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
        }
        console.log('_getFilters - queries =', queries);
        return queries;
    }
});
