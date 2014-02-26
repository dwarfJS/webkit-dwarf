/*!
 * webkit-dwarf
 * Copyright(c) 2013 Daniel Yang <miniflycn@gmail.com>
 * MIT Licensed
 */

!function (root) {
	/* var */
	var 
		_head = document.getElementsByTagName('head')[0],
		_base,
		_path = {},
		_localBase,
		_require,
		DOT_RE = /\/\.\//g,
		DOUBLE_DOT_RE = /\/[^/]+\/\.\.\//,
		DOUBLE_SLASH_RE = /([^:/])\/\//g,
		IS_PATH = /^\.|\//,
		IS_URL = /(^https?|^file):\/\//;

	/* Tool */
	function _isFunction(f) {
		return typeof f === 'function';
	}

	function _normalize(base, id) {
		if (_isUnnormalId(id)) return id;
		if (_isRelativePath(id)) return _resolvePath(base, id) + '.js';
	}

	function _isUnnormalId(id) {
		return (/^https?:|^\/|.js$/).test(id);
	}

	function _isRelativePath(path) {
		return (path + '').indexOf('.') === 0;
	}

	// reference from seajs
	function _resolvePath(base, path) {
		if (IS_PATH.test(path)) {
			path = base.substring(0, base.lastIndexOf('/') + 1) + path;
			path = path.replace(DOT_RE, '/');
			while (path.match(DOUBLE_DOT_RE)) {
				path = path.replace(DOUBLE_DOT_RE, '/');
			}
			return path = path.replace(DOUBLE_SLASH_RE, '$1/');
		} else {
			return path;
		}
	}

	/* Class */
	/**
	 * Cache
	 * @class
	 * @static
	 */
	var Cache = function () {
		var map = {};
		return {
			/**
			 * get
			 * @param {String} key
			 * @returns value
			 */
			get: function (key) {
				return map[key];
			},
			/**
			 * set
			 * @param {String} key
			 * @param {Object} value
			 * @returns isSuccess
			 */
			set: function (key, value) {
				if (key in map) return false;
				map[key] = value;
				return true;
			}
		};
	}();

	/**
	 * Def
	 * @class
	 * @static
	 */
	var Def = function () {
		var stack = [];

		return {
			/**
			 * push
			 * @param {Object} o
			 */
			push: function () {
				return stack.push.apply(stack, arguments);
			},
			/**
			 * make
			 * @param {String} src
			 */
			make: function (src) {
				stack.forEach(function (o) {
					var 
						module = _normalize(src, o.m),
						deps = o.d,
						factory = o.f;
					return makeRequire({ base: src })(deps, function () {
						var loader = Cache.get(module);
						if (!loader) {
							loader = new Loader(module, true);
							Cache.set(module, loader);
						}
						return !loader.loaded && loader.set(factory);
					});
				});
				stack.length = 0;
			}
		};
	}();

	/**
	 * Loader
	 * @class
	 * @param {String} url
	 */
	function Loader(url, prevent) {
		IS_URL.test(url) || (url = _path[url]);
		if (!url) throw new Error('url is not correct!');
		!prevent && this.load(url);
		this.path = url;
		this.succList = [];
		this.failList = [];
	}
	Loader.prototype = {
		constructor: Loader,
		/**
		 * load
		 * @param {String} url
		 */
		load: function (url) {
			var 
				node = document.createElement('script'),
				self = this;
			node.addEventListener('load', _onload, false);
			node.addEventListener('error', _onerror, false);
			node.type = 'text/javascript';
			node.async = 'async';
			node.src = url;
			_head.appendChild(node);
			function _onload() {
				_onend();
				return Def.make(this.src);
			}
			function _onerror() {
				_onend();
				_head.removeChild(node);
				if (_base && !~url.indexOf(_localBase)) {
					return self.load(url.replace(_base, _localBase));
				} else {
					return self.down();
				}
			}
			function _onend() {
				node.removeEventListener('load', _onload, false);
				node.removeEventListener('error', _onerror, false);
			}
		},
		/**
		 * _push
		 * @private
		 * @param {Array} list
		 * @param {Function} cb
		 */
		_unshift: function (list, cb) {
			if (!list.some(function (item) { return item === cb }))
				return list.unshift(cb);
		},
		/**
		 * succ
		 * @param {Function} cb
		 */
		succ: function (cb) {
			return this._unshift(this.succList, cb);
		},
		/**
		 * fail
		 * @param {Function} cb
		 */
		fail: function (cb) {
			return this._unshift(this.failList, cb);
		},
		/**
		 * done
		 */
		done: function () {
			this.loaded = true;
			this.succList.forEach(function (cb) {
				return cb();
			});
		},
		/**
		 * down
		 */
		down: function () {
			this.failList.forEach(function (cb) {
				return cb();
			});
		},
		/**
		 * require
		 * @returns exports
		 */
		require: function () {
			if (this.factory) {
				var module = { exports: {} };
				this.factory(makeRequire({ base: this.path }), module.exports, module);
				this.exports = module.exports;
				this.require = function () {
					return this.exports;
				};
				return this.require();
			} else {
				return new Error('script has not loaded.');
			}
		},
		/**
		 * set
		 * @param {Function} factory
		 */
		set: function (factory) {
			this.factory = factory;
			return this.done();
		}
	}

	/* returns */

	/**
	 * makeRequire
	 * @param {Object} opts
	 * @returns require
	 */
	function makeRequire(opts) {
		var base = opts.base;
		function _r(deps, succ, fail) {
			var fired;
			if (succ) {
				function _checkDeps() {
					var res = [];
					deps.forEach(function (dep, i) {
						var 
							path = _normalize(base, dep),
							loader = Cache.get(path);
						if (!loader) {
							loader = new Loader(path);
							Cache.set(path, loader);
						}
						if (loader.loaded) {
							return;
						} else {
							res.push(dep);
						}
						loader.succ(_checkDeps);
						fail && loader.fail(fail);
					});
					deps = res;
					// make sure success callback will not trigger multiple times
					if (!deps.length && !fired) {
						fired = true;
						succ();
					}
				}
				_checkDeps();
			} else {
				var 
					path = _normalize(base, deps),
					loader = Cache.get(path);
				if (loader.loaded) {
					return loader.require();
				} else {
					throw new Error('script has not loaded.');
				}
			}
		}
		return _r;
	}

	/**
	 * define
	 * define(module, deps, factory)
	 * define(module, factory)
	 * define(module, value)
	 */
	function define(module, deps, factory) {
		if (!factory) {
			if (_isFunction(deps)) {
				factory = deps;
			} else {
				var tmp = deps;
				factory = function (require, exports, module) {
					return module.exports = tmp;
				}
			}
			deps = [];
		}
		Def.push({
			m: module,
			d: deps,
			f: factory
		});
	}

	function opt(opts) {
		_base = (opts.base === undefined ? _base : opts.base);
		_path = opts.path || _path;
	}

	/**
	 * require
	 * require(deps, succ, [fail])
	 * require(module)
	 * @param {Array} deps
	 * @param {Function} succ
	 * @param {Function} fail
	 */
	var require = root.require = function () {
		if (_require) return _require.apply(root, arguments);
		Def.make(_base || location.href);
		if (_base) {
			_require = makeRequire({ base: _base });
			_localBase = location.href;
		} else {
			_require = makeRequire({ base: location.href });
		}
		return _require.apply(root, arguments);
	}
	require.opt = opt;
	require.makeRequire = makeRequire;
	root.define = define;

}(window);