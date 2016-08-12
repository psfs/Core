(function() {
    app = app || angular.module(module || 'psfs', ['ngMaterial', 'ngSanitize', 'bw.paging']);

    var formCtrl = ['$scope', '$http', '$msgSrv', '$log', '$apiSrv', '$mdDialog', '$q',
        function($scope, $http, $msgSrv, $log, $apiSrv, $mdDialog, $q) {
            $scope.method = 'POST';
            $scope.loading = false;
            $scope.combos = {};
            $apiSrv.setEntity($scope.entity);

            function loadFormFields()
            {
                $scope.loading = true;
                $log.debug('Loading entity form info');
                $http.get($scope.url.replace($scope.entity, 'form/' + $scope.entity))
                    .then(function(response) {
                        $log.debug('Entity form loaded');
                        $scope.form = response.data.data || {};
                        $scope.loading = false;
                    }, function(err, status) {
                        $log.error(err);
                        $scope.loading = false;
                    });
            }

            function isInputField(field)
            {
                var type = (field.type || 'text').toUpperCase();
                return (type === 'TEXT' || type === 'TEL' || type === 'URL' || type === 'NUMBER');
            }

            function isComboField(field)
            {
                var type = (field.type || 'text').toUpperCase();
                return (type === 'SELECT' || type === 'MULTIPLE');
            }

            function loadSelect(field)
            {
                if (field.url) {
                    $http.get(field.url + '?__limit=-1')
                    .then(function(response) {
                        field.data = response.data.data ||[];
                    });
                }
            }

            function submitForm()
            {
                if ($scope.entity_form.$valid) {
                    $log.debug('Entity form submitted');
                    $scope.loading = true;
                    var model = $scope.model;
                    try {
                        $http.put($scope.url + '/' + $apiSrv.getId(model), model)
                            .then(function(response){
                                $scope.loading = false;
                                $scope.model = {};
                                $scope.entity_form.$setPristine(true);
                                $scope.entity_form.$setDirty(false);
                            }, function(err, status) {
                                $log.error(err);
                                $scope.loading = false;
                            });
                    } catch(err) {
                        $log.debug('Create new entity');
                        $http.post($scope.url, model)
                            .then(function(response){
                                $scope.loading = false;
                                $scope.model = {};
                                $scope.entity_form.$setPristine(true);
                                $scope.entity_form.$setDirty(false);
                            }, function(err, status) {
                                $log.error(err);
                                $scope.loading = false;
                            });
                    } finally {
                        $msgSrv.send('psfs.list.reload');
                    }
                } else {
                    $mdDialog.show(
                        $mdDialog.alert()
                            .clickOutsideToClose(true)
                            .title($scope.entity + ' form invalid')
                            .content($scope.entity + ' form invalid, please complete the form')
                            .ariaLabel('Invalid form')
                            .ok('Close')
                    );
                }

                return false;
            }

            function querySearch(search, field) {
                deferred = $q.defer();
                $http.get(field.url.replace(/\/\{pk\}$/ig, '') + '?__limit=10&name=' + encodeURIComponent("'"+search+"'"))
                    .then(function(response) {
                        deferred.resolve(response.data.data || []);
                    }, function() {
                        deferred.resolve([]);
                    });

                return deferred.promise;
            }

            function setComboField(item, field) {
                $scope.model[field.name] = item ? $apiSrv.getId(item, field.entity) : null;
            }

            $scope.isInputField = isInputField;
            $scope.loadSelect = loadSelect;
            $scope.isComboField = isComboField;
            $scope.getId = $apiSrv.getId;
            $scope.getLabel = $apiSrv.getLabel;
            $scope.submitForm = submitForm;
            $scope.querySearch = querySearch;
            $scope.setComboField = setComboField;

            loadFormFields();
        }];

    app
    .directive('apiForm', function() {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: '/js/templates/api-form.html',
            controller: formCtrl
        };
    });
})();