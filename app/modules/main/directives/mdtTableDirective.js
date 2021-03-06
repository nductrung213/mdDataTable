(function(){
    'use strict';

    /**
     * @ngdoc directive
     * @name mdtTable
     * @restrict E
     *
     * @description
     * The base HTML tag for the component.
     *
     * @param {object=} tableCard when set table will be embedded within a card, with data manipulation tools available
     *      at the top and bottom.
     *
     *      Properties:
     *
     *      - `{boolean=}` `visible` - enable/disable table card explicitly
     *      - `{string}` `title` - the title of the card
     *      - `{array=}` `actionIcons` - (not implemented yet)
     *
     * @param {boolean=} selectableRows when set each row will have a checkbox
     * @param {boolean=} virtualRepeat when set, virtual scrolling will be applied to the table. You must set a fixed
     *      height to the `.md-virtual-repeat-container` class in order to make it work properly. Since virtual
     *      scrolling is working with fixed height.
     * @param {String=} alternateHeaders some table cards may require headers with actions instead of titles.
     *      Two possible approaches to this are to display persistent actions, or a contextual header that activates
     *      when items are selected
     *
     *      Assignable values are:
     *
     *      - 'contextual' - when set table will have kind of dynamic header. E.g.: When selecting rows, the header will
     *        change and it'll show the number of selected rows and a delete icon on the right.
     *      - 'persistentActions' - (not implemented yet)
     *
     * @param {boolean=} sortableColumns sort data and display a sorted state in the header. Clicking on a column which
     *      is already sorted will reverse the sort order and rotate the sort icon.
     *      (not implemented yet: Use `sortable-rows-default` attribute directive on a column which intended to be the
     *      default sortable column)
     *
     * @param {function(rows)=} deleteRowCallback callback function when deleting rows.
     *      At default an array of the deleted row's data will be passed as the argument.
     *      When `table-row-id` set for the deleted row then that value will be passed.
     *
     * @param {function(rows)=} selectedRowCallback callback function when selecting rows.
     *      At default an array of the selected row's data will be passed as the argument.
     *      When `table-row-id` set for the selected row then that value will be passed.
     *
     * @param {boolean=} animateSortIcon sort icon will be animated on change
     * @param {boolean=} rippleEffect ripple effect will be applied on the columns when clicked (not implemented yet)
     * @param {boolean=} paginatedRows if set then basic pagination will applied to the bottom of the table.
     *
     *      Properties:
     *
     *      - `{boolean=}` `isEnabled` - enables pagination
     *      - `{array}` `rowsPerPageValues` - set page sizes. Example: [5,10,20]
     *
     * @param {object=} mdtRow passing rows data through this attribute will initialize the table with data. Additional
     *      benefit instead of using `mdt-row` element directive is that it makes possible to listen on data changes.
     *
     *      Properties:
     *
     *      - `{array}` `data` - the input data for rows
     *      - `{integer|string=}` `table-row-id-key` - the uniq identifier for a row
     *      - `{array}` `column-keys` - specifying property names for the passed data array. Makes it possible to
     *        configure which property assigned to which column in the table. The list should provided at the same order
     *        as it was specified inside `mdt-header-row` element directive.
     *
     * @param {function(page, pageSize)=} mdtRowPaginator providing the data for the table by a function. Should set a
     *      function which returns a promise when it's called. When the function is called, these parameters will be
     *      passed: `page` and `pageSize` which can help implementing an ajax-based paging.
     *
     * @param {string=} mdtRowPaginatorErrorMessage overrides default error message when promise gets rejected by the
     *      paginator function.
     *
     * @param {string=} mdtRowPaginatorNoResultsMessage overrides default 'no results' message.
     *
     * @param {function(loadPageCallback)=} mdtTriggerRequest provide a callback function for manually triggering an
     *      ajax request. Can be useful when you want to populate the results in the table manually. (e.g.: having a
     *      search field in your page which then can trigger a new request in the table to show the results based on
     *      that filter.
     *
     *
     * @example
     * <h2>`mdt-row` attribute:</h2>
     *
     * When column names are: `Product name`, `Creator`, `Last Update`
     * The passed data row's structure: `id`, `item_name`, `update_date`, `created_by`
     *
     * Then the following setup will parse the data to the right columns:
     * <pre>
     *     <mdt-table
     *         mdt-row="{
     *             'data': controller.data,
     *             'table-row-id-key': 'id',
     *             'column-keys': ['item_name', 'update_date', 'created_by']
     *         }">
     *
     *         <mdt-header-row>
     *             <mdt-column>Product name</mdt-column>
     *             <mdt-column>Creator</mdt-column>
     *             <mdt-column>Last Update</mdt-column>
     *         </mdt-header-row>
     *     </mdt-table>
     * </pre>
     */
    function mdtTableDirective(TableDataStorageFactory, mdtPaginationHelperFactory, mdtAjaxPaginationHelperFactory, $mdDialog){
        return {
            restrict: 'E',
            templateUrl: '/main/templates/mdtTable.html',
            transclude: true,
            scope: {
                tableCard: '=',
                selectableRows: '=',
                alternateHeaders: '=',
                sortableColumns: '=',
                deleteRowCallback: '&',
                selectedRowCallback: '&',
                saveRowCallback: '&',
                animateSortIcon: '=',
                rippleEffect: '=',
                paginatedRows: '=',
                mdtRow: '=',
                mdtRowPaginator: '&?',
                mdtRowPaginatorErrorMessage:"@",
                mdtRowPaginatorNoResultsMessage:"@",
                virtualRepeat: '=',
                mdtTriggerRequest: '&?'
            },
            controller: function mdtTableController($scope){
                var vm = this;

                initTableStorageServiceAndBindMethods();

                vm.addHeaderCell = addHeaderCell;

                function initTableStorageServiceAndBindMethods(){
                    vm.tableDataStorageService = TableDataStorageFactory.getInstance();

                    if(!$scope.mdtRowPaginator){
                        $scope.mdtPaginationHelper = mdtPaginationHelperFactory
                            .getInstance(vm.tableDataStorageService, $scope.paginatedRows, $scope.mdtRow);
                    }else{
                        $scope.mdtPaginationHelper = mdtAjaxPaginationHelperFactory.getInstance({
                            tableDataStorageService: vm.tableDataStorageService,
                            paginationSetting: $scope.paginatedRows,
                            mdtRowOptions: $scope.mdtRow,
                            mdtRowPaginatorFunction: $scope.mdtRowPaginator,
                            mdtRowPaginatorErrorMessage: $scope.mdtRowPaginatorErrorMessage,
                            mdtRowPaginatorNoResultsMessage: $scope.mdtRowPaginatorNoResultsMessage,
                            mdtTriggerRequest: $scope.mdtTriggerRequest
                        });
                    }
                }

                function addHeaderCell(ops){
                    vm.tableDataStorageService.addHeaderCellData(ops);
                }
            },
            link: function($scope, element, attrs, ctrl, transclude){
                $scope.headerData = ctrl.tableDataStorageService.header;
                $scope.isPaginationEnabled = isPaginationEnabled;
                $scope.isAnyRowSelected = _.bind(ctrl.tableDataStorageService.isAnyRowSelected, ctrl.tableDataStorageService);
                $scope.onCheckboxChange = onCheckboxChange;
                $scope.saveRow = saveRow;
                $scope.showEditDialog = showEditDialog;

                injectContentIntoTemplate();

                if(!_.isEmpty($scope.mdtRow)) {
                    processAttributeProvidedData();
                }

                function onCheckboxChange(){
                    $scope.selectedRowCallback({
                        rows: ctrl.tableDataStorageService.getSelectedRows()
                    });
                }

                function processAttributeProvidedData(){
                    //local search/filter
                    if (angular.isUndefined(attrs.mdtRowPaginator)) {
                        $scope.$watch('mdtRow', function (mdtRow) {
                            ctrl.tableDataStorageService.storage = [];

                            addRawDataToStorage(mdtRow['data']);
                        }, true);
                    }else{
                        //if it's used for 'Ajax pagination'
                    }
                }

                function addRawDataToStorage(data){
                    var rowId;
                    var columnValues = [];
                    _.each(data, function(row){
                        rowId = _.get(row, $scope.mdtRow['table-row-id-key']);
                        columnValues = [];

                        _.each($scope.mdtRow['column-keys'], function(columnKey){
                            columnValues.push({
                                attributes: {
                                    editableField: false
                                },
                                columnKey: columnKey,
                                value: _.get(row, columnKey)
                            });
                        });

                        ctrl.tableDataStorageService.addRowData(rowId, columnValues);
                    });
                }

                function isPaginationEnabled(){
                    if($scope.paginatedRows === true || ($scope.paginatedRows && $scope.paginatedRows.hasOwnProperty('isEnabled') && $scope.paginatedRows.isEnabled === true)){
                        return true;
                    }

                    return false;
                }

                function injectContentIntoTemplate(){
                    transclude(function (clone) {
                        var headings = [];
                        var body = [];
                        var customCell = [];

                        _.each(clone, function (child) {
                            var $child = angular.element(child);

                            if ($child.hasClass('theadTrRow')) {
                                headings.push($child);
                            } else if($child.hasClass('customCell')) {
                                customCell.push($child);
                            } else {
                                body.push($child);
                            }
                        });

                        element.find('#reader').append(headings).append(body);
                    });
                }

                function saveRow(rowData){
                    var rawRowData = ctrl.tableDataStorageService.getSavedRowData(rowData);
                    $scope.saveRowCallback({row: rawRowData});
                }

                function showEditDialog(ev, cellData, rowData){
                    var rect = ev.currentTarget.closest('td').getBoundingClientRect();
                    var position = {
                        top: rect.top,
                        left: rect.left
                    };

                    var ops = {
                        controller: 'InlineEditModalCtrl',
                        targetEvent: ev,
                        clickOutsideToClose: true,
                        escapeToClose: true,
                        focusOnOpen: false,
                        locals: {
                            position: position,
                            cellData: JSON.parse(JSON.stringify(cellData))
                        }
                    };

                    if(cellData.attributes.editableField === 'smallEditDialog'){
                        ops.templateUrl = '/main/templates/smallEditDialog.html';
                    }else{
                        ops.templateUrl = '/main/templates/largeEditDialog.html';
                    }

                    var that = this;
                    $mdDialog.show(ops).then(function(cellValue){
                        cellData.value = cellValue;

                        that.saveRow(rowData);
                    });
                }
            }
        };
    }

    angular
        .module('mdDataTable')
        .directive('mdtTable', mdtTableDirective);
}());