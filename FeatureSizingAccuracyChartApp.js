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

    launch: function() {
        Rally.data.wsapi.ModelFactory.getModel({
            type: 'PortfolioItem',
        }).then({
            success: this._loadMetadata,
            scope: this
        });
    },

    _getLowestLevelPI: function() {
        return Ext.create('Rally.data.wsapi.Store', {
            model: 'TypeDefinition',
            filters: [
                { property: 'Creatable', value: true }, 
                { property: 'Parent.Name', value: 'Portfolio Item' },
                { property: 'Ordinal', value: 0 }
            ]
        }).load().then({
            success: function(records) {
                return records[0].get('TypePath');
            },
            scope: this
        });
    },

    _getSizes: function() {
        return this.model.getField('PreliminaryEstimate').getAllowedValueStore().load().then({
            success: function(sizes) {
                return _.compact(_.invoke(sizes, 'get', 'StringValue'));
            },
            scope: this
        });
    },
    
    _loadMetadata: function(model) {
        this.model = model;
        return Deft.Promise.all([
            this._getLowestLevelPI(),
            this._getSizes()
        ]).then({
            success: this._onMetaRetrieved,
            scope: this
        });
    },

    _onMetaRetrieved: function(meta) {
        this.piType = meta[0];
        this.sizes = meta[1];
        this._addChart();
    },

    _addChart: function() {
        var context = this.getContext(),
            whiteListFields = ['Milestones', 'Tags'],
            modelNames = [this.model.typePath],
            gridBoardConfig = {
                xtype: 'rallygridboard',
                toggleState: 'chart',
                chartConfig: this._getChartConfig(),
                plugins: [{
                    ptype:'rallygridboardinlinefiltercontrol',
                    showInChartMode: true,
                    inlineFilterButtonConfig: {
                        stateful: true,
                        stateId: context.getScopedStateId('filters'),
                        filterChildren: false,
                        modelNames: modelNames,
                        inlineFilterPanelConfig: {
                            quickFilterPanelConfig: {
                                defaultFields: [],
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
                modelNames: modelNames,
                storeConfig: {
                    filters: this._getFilters()
                }
            };

        this.add(gridBoardConfig);
    },

    _getChartConfig: function() {
        return {
            xtype: 'rallychart',
            chartColors: ['#937bb7'],
            storeType: 'Rally.data.wsapi.Store',
            storeConfig: {
                context: this.getContext().getDataContext(),
                limit: Infinity,
                fetch: this._getChartFetch(),
                sorters: this._getChartSort(),
                pageSize: 2000,
                model: this.piType
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
                        text: 'Days'
                    }
                },
                plotOptions: {
                    column: {
                        dataLabels: {
                            enabled: false
                        }
                    }
                }
            }
        };
    },

    onTimeboxScopeChange: function() {
        this.callParent(arguments);

        var gridBoard = this.down('rallygridboard');
        if (gridBoard) {
            gridBoard.destroy();
        }
        this._addChart();
    },

    _getChartFetch: function() {
        return ['ActualStartDate', 'ActualEndDate', 'Release'];
    },

    _getChartSort: function() {
        if (this.getSetting('bucketBy') === 'release') {
            return [{ property: 'Release.ReleaseDate', direction: 'ASC' }];
        } else {
            return [{ property: 'ActualEndDate', direction: 'ASC' }];
        }
    },

    _getFilters: function() {
        var queries = [{
            property: 'ActualEndDate',
            operator: '!=',
            value: null
        }];

        if (this.getSetting('bucketBy') === 'release') {
            queries.push({
                property: 'Release',
                operator: '!=',
                vaue: null
            });
        }

        var timeboxScope = this.getContext().getTimeboxScope();
        if (timeboxScope && timeboxScope.isApplicable(this.model)) {
            queries.push(timeboxScope.getQueryFilter());
        }
        if (this.getSetting('query')) {
            queries.push(Rally.data.QueryFilter.fromQueryString(this.getSetting('query')));
        }
        return queries;
    }
});
