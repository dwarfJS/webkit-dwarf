define('./cal', 
	['../math/add', '../math/sub', '../math/multi', '../math/div'], 
	function (require, exports, module) {
		var 
			add = require('../math/add'),
			sub = require('../math/sub'),
			multi = require('../math/multi'),
			div = require('../math/div');
		module.exports = function () {
			// (7 - 3) * 2 / 4 = 2
			return div(multi(sub(add(5, 2), 3), 2), 4);
		};
	}
);