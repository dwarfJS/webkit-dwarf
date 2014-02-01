describe('require', function () {
	it('should able to require a preload module', function () {
		define('./test', 'test');
		require(['./test'], function () {
			var test = require('./test');
			test.should.equal('test');
		});
	});

	it('should able to require a module', function (done) {
		require(['./mod/math/add'], function () {
			var add = require('./mod/math/add');
			add(1, 2).should.equal(3);
			done();
		});
	});

	it('should able to define a dependencies', function (done) {
		require(['./mod/cal/cal'], function () {
			var cal = require('./mod/cal/cal');
			cal().should.equal(2);
			done();
		});
	});

	it('should able to callback when load error', function (done) {
		require(['./mod/error/noexist'], function () {}, function () {
			done();
		});
	});
});