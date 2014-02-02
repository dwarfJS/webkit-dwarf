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
		_localBase,
		_require;

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

	function _resolvePath(base, path) {
		var 
			bArr = base.split('/'),
			pArr = path.split('/'),
			part;
		bArr.pop();
		while (pArr.length) {
			part = pArr.shift();
			if (part == '..') {
				if (bArr.length) {
					part = bArr.pop();
					while (part == '.') {
						part = bArr.pop();
					}
					if (part == '..') {
						bArr.push('..', '..');
					}
				} else {
					bArr.push(part);
				}
			} else if (part != '.') {
				bArr.push(part);
			}
		}
		path = bArr.join('/');
		return path;
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
						return loader.set(factory);
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
		_push: function (list, cb) {
			if (!list.some(function (item) { return item === cb }))
				return list.push(cb);
		},
		/**
		 * succ
		 * @param {Function} cb
		 */
		succ: function (cb) {
			return this._push(this.succList, cb);
		},
		/**
		 * fail
		 * @param {Function} cb
		 */
		fail: function (cb) {
			return this._push(this.failList, cb);
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
			if (succ) {
				function _checkDeps() {
					deps.slice(0).forEach(function (dep, i) {
						dep = _normalize(base, dep);
						var loader = Cache.get(dep);
						if (!loader) {
							loader = new Loader(dep);
							Cache.set(dep, loader);
						}
						if (loader.loaded) return deps.splice(i, 1);
						loader.succ(_checkDeps);
						return loader.fail(fail);
					});
					if (!deps.length) return succ();
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