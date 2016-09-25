(function(){
    app = app || angular.module(module || 'psfs', ['ngMaterial', 'ngSanitize', 'bw.paging']);

    var listCtrl = ['$scope', '$log', '$http', '$mdDialog', '$msgSrv', '$apiSrv',
    function($scope, $log, $http, $mdDialog, $msgSrv, $apiSrv){
        $scope.loading = false;
        $scope.limit = globalLimit || 10;
        $scope.actualPage = 1;
        $scope.count = 0;

        function catchError(response)
        {
            $mdDialog.show(
                $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('An error ocurred')
                    .content(response)
                    .ariaLabel('Alert Error Dialog')
                    .ok('Close')
            );
            $scope.loading = false;
        }

        function paginate(page)
        {
            $scope.actualPage = page || 1;
            loadData();
        }

        function loadData()
        {
            var queryParams = {
                '__limit': $scope.limit,
                '__page': $scope.actualPage
            };
            $scope.loading = true;
            try {
                $http.get($scope.url, {params: queryParams})
                    .then(function(result) {
                        $log.info(result);
                        $scope.list = result.data.data;
                        $scope.loading = false;
                        $scope.count = result.data.total;
                    }, catchError);
            } catch(err) {
                $log.error(err.message);
            }
        }

        function deleteItem(item)
        {
            $scope.loading = true;
            var confirm = $mdDialog.confirm()
                .title('Would you like to delete ' + $apiSrv.getLabel(item) + '?')
                .content('If you delete this element, maybe lost some related data')
                .ariaLabel('Delete Element')
                .ok('Delete')
                .cancel('Cancel');
            $mdDialog.show(confirm).then(function() {
                $http.delete($scope.url + "/" + $apiSrv.getId(item))
                    .then(loadData);
            }, function() {
                $scope.loading = false;
            });
        }

        function loadItem(item)
        {
            $scope.model = angular.copy(item);
        }

        function isModelSelected() {
            return !angular.equals({}, $scope.model);
        }

        function addNewItem() {
            $scope.model = {};
            $scope.entity_form.$setDirty(false);
            $scope.entity_form.$setPristine(true);
        }

        $scope.getLabel = $apiSrv.getLabel;
        $scope.loadData = loadData;
        $scope.loadItem = loadItem;
        $scope.deleteItem = deleteItem;
        $scope.paginate = paginate;
        $scope.getId = $apiSrv.getId;
        $scope.isModelSelected = isModelSelected;
        $scope.addNewItem = addNewItem;

        $scope.$on('psfs.list.reload', loadData);

        loadData();
    }];

    app
    .directive('apiLists', function() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: '/js/templates/api-list.html',
            controller: listCtrl
        };
    });
})();