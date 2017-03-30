(function(){
    app = app || angular.module(module || 'psfs', []);
    /**
     * Message Service
     * @type {*[]}
     */
    var messageService = ['$rootScope', '$log', function($rootScope, $log) {
        var config = {
            debug: true
        };
        return {
            'send': function(message, data) {
                if(config.debug) {
                    $log.debug('Event: ' + message);
                    if(!angular.isUndefined(data) && null !== data) {
                        $log.debug(data);
                    }
                }
                $rootScope.$broadcast(message, data);
            },
            $config: function($config) {
                if(angular.isObject($config)) {
                    angular.forEach($config, function(value, key) {
                        config[key] = value;
                    });
                }
            }
        };
    }];
    app.service('$msgSrv', messageService);
    var entitySrv = ['$log', function($log) {
        var entity;

        function getLabelField(item) {
            if (item) {
                if('__name__' in item) return '__name__';
                if('label' in item) return 'label';
                if('Label' in item) return 'Label';
                if('name' in item) return 'name';
                if('Name' in item) return 'Name';
                if('title' in item) return 'title';
                if('Title' in item) return 'Title';
            }
            return '';
        }

        function getLabel(item)
        {
            if (item) {
                var label = getLabelField(item);
                if(label in item) {
                    return item[label];
                }
            }
            return '';
        }

        function getPkField(fields) {
            var pk = null;
            fields = fields || {};
            for(var i in fields) {
                var field = fields[i];
                if(field.pk) {
                    pk = field.name;
                }
            }
            return pk;
        }

        function getId(item, fields)
        {
            var pk = getPkField(fields);
            if (null !== pk) {
                if (item[pk]) {
                    return item[pk];
                } else if('__pk' in item){
                    return item['__pk'];
                } else {
                    throw new Error('Unidentified element');
                }
            } else if('__pk' in item){
                return item['__pk'];
            } else {
                throw new Error('Null object!!!');
            }
        }

        function setEntity(entity) {
            this.entity = entity;
        }

        return {
            getLabel: getLabel,
            getLabelField: getLabelField,
            getId: getId,
            setEntity: setEntity,
            getPkField: getPkField
        };
    }];
    app.service('$apiSrv', entitySrv);
    /**
     * Message Service
     * @type {*[]}
     */
    var httpService = ['$rootScope', '$log', '$http', '$msgSrv',
        function($rootScope, $log, $http, $msgSrv) {
        var srvConfig = {
            psfsToken: null,
            psfsTokenUrl: null,
            userToken: null,
            debug: true
        };

        /**
         *
         * @param $method string
         * @param $url string
         * @param $data object
         * @returns object
         * @private
         */
        function __prepare($method, $url, $data) {
            var config = {
                method: $method,
                url: $url,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
                    'Access-Control-Allow-Headers': '*',
                    'Content-Type': 'application/json',
                    'X-API-SEC-TOKEN': srvConfig.psfsToken
                }
            };
            if(srvConfig.userToken) {
                config.headers['Authorization'] = 'Bearer ' + srvConfig.userToken;
            }
            if(!angular.isUndefined($data) && angular.isObject($data)) {
                if($method === 'GET') {
                    config.params = $data;
                } else {
                    config.data = $data;
                }
            }
            return config;
        }

        /**
         * @param $promise $http
         * @param $method string
         * @param $url string
         * @returns {*}
         * @private
         */
        function __return($promise, $method, $url) {
            return $promise.finally(function() {
                if(srvConfig.debug) {
                    $log.debug($url + ' request finished');
                }
                $msgSrv.send('request.' + $method.toLowerCase() + '.finished');
                $msgSrv.send('request.finished');
                return true;
            });
        }

        /**
         * @param $method string
         * @param $url string
         * @param $data object
         * @returns promise
         * @private
         */
        function __call($method, $url, $data) {
            var config = __prepare($method, $url, $data);

            $msgSrv.$config({
                debug: srvConfig.debug
            });

            if(srvConfig.debug) {
                $log.debug($url + ' request started');
            }
            $msgSrv.send('request.started');
            $msgSrv.send('request.' + $method.toLowerCase() + '.started');
            return __return($http(config), $method, $url);
        }

        function __upload($url, $data) {
            var config = __prepare('POST', $url, $data);
            config.headers['Content-Type'] = undefined;
            config.transformRequest = angular.identity;

            $msgSrv.$config({
                debug: srvConfig.debug
            });

            if(srvConfig.debug) {
                $log.debug($url + ' request started');
            }
            $msgSrv.send('request.started');
            $msgSrv.send('request.upload.started');
            return __return($http(config), 'upload', $url);
        }

        /**
         * @param $method
         * @param $url
         * @param $data
         * @returns {*}
         * @private
         */
        function __download($method, $url, $data) {
            var config = __prepare($method, $url, $data);
            config.headers['Content-Type'] = 'blob';
            config.headers['Accept'] = 'blob';
            config.responseType = "blob";
            config.transformRequest = angular.identity;
            config.transformResponse = angular.identity;

            $msgSrv.$config({
                debug: srvConfig.debug
            });

            if(srvConfig.debug) {
                $log.debug($url + ' request started');
            }
            $msgSrv.send('request.started');
            $msgSrv.send('request.download.started');

            return __return($http(config)
                .then(function(response) {
                    var headers = response.headers(),
                        fileName = headers['fileName'] || 'noname';
                    if('noname' === fileName && 'content-disposition' in headers) {
                        fileName = headers['content-disposition'].split(/filename\=/ig).slice(-1).pop().replace(/(\"|\')/ig, '');
                    }
                    if('noname' === fileName) {
                        var cType = headers['content-type'].split('/').slice(-1).pop();
                        fileName += '.' + cType;
                    }
                    var anchor = angular.element('<a/>');
                    var blob = new Blob([response.data], { type: headers['content-type'] });                    anchor.attr({
                        href: window.URL.createObjectURL(blob),
                        target: '_blank',
                        download: fileName
                    })[0].click();
                }), 'download', $url)
                .catch(function(error) {
                    $log.error(error);
                });
        }

        return {
            $get: function(url, query) {
                return __call('GET', url, query);
            },
            $post: function(url, data) {
                return __call('POST', url, data);
            },
            $put: function(url, data) {
                return __call('PUT', url, data);
            },
            $delete: function(url) {
                return __call('DELETE', url, null);
            },
            $upload: function(url, data) {
                return __upload(url, data);
            },
            $download: function(method, url, queryData) {
                method = method || 'GET';
                var promise;
                switch(method.toUpperCase()) {
                    default:
                    case 'GET':
                        promise = __download('GET', url, queryData);
                        break;
                    case 'POST':
                        promise = __download('POST', url, queryData);
                        break;
                }
                return promise;
            },
            $config: function($config) {
                if(angular.isObject($config)) {
                    angular.forEach($config, function(value, key) {
                        srvConfig[key] = value;
                    });
                }
            }
        };
    }];
    app.service('$httpSrv', httpService);
})();
var $httpSrv;
function loadCallService() {
    try {
        $httpSrv = angular.element(document.body).injector().get('$httpSrv');
    } catch (err) {
        setTimeout(loadCallService, 100);
    }
}

loadCallService();