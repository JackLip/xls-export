(function () {
    'use strict';

    angular.module('app', [])
        .controller('AppController', AppController)
        .filter('notIn', notIn);

    AppController.$inject = ['$scope', '$filter'];
    function AppController($scope, $filter) {
        var vm = this;

        angular.extend(vm, {
            selectedFile: null,
            filter: {},
            exportable: {
                rows: []
            },
            addRow: addRow,
            removeRow: removeRow,
            submitAllRows: submitAllRows,
            onFileChanged: onFileChanged
        });

        function addRow(row) {
            vm.exportable.rows.push(row);
        }

        function removeRow(row) {
            var index = vm.exportable.rows.indexOf(row);

            if (index !== -1) {
                vm.exportable.rows.splice(index, 1);
            }
        }

        function submitAllRows($event) {
            if ($event.keyCode !== 13) {
                return;
            }

            var hasFilters = Object.keys(vm.filter).reduce(function (has, prop) {
                return has || (vm.filter[prop] && ('' + vm.filter[prop]).trim() !== '');
            }, false);

            if (!hasFilters) {
                return;
            }

            var rowsToSubmit = $filter('filter')(vm.table.rows, vm.filter);
            var notInExportable = $filter('notIn')(rowsToSubmit, vm.exportable.rows);

            if (notInExportable.length) {
                vm.addRow(notInExportable[0]);
            }
        }

        function onFileChanged($event) {
            var files = $event.target.files;

            if (!files.length) {
                return;
            }

            var file = files[0];

            var reader = new FileReader();
            var name = file.name;

            reader.onload = onFileDataLoaded
            reader.readAsBinaryString(file);
        }

        function onFileDataLoaded(e) {
            var data = e.target.result;

            var workbook = XLSX.read(data, { type: 'binary' });
            var first_sheet_name = workbook.SheetNames[0];

            var worksheet = workbook.Sheets[first_sheet_name];

            var rows = XLSX.utils.sheet_to_json(worksheet);

            if (!rows.length) {
                return;
            }

            var heads = Object.keys(rows[0]); // ['age', 'number', 'height']'

            vm.table = {
                heads: heads,
                rows: rows
            }

            $scope.$apply();
        }
    }

    function notIn() {
        return function (arr, exists) {
            return arr.filter(function (item) {
                return exists.filter(function (row) {
                    return angular.equals(row, item);
                }).length === 0;
            });
        }
    }
})();
