module.exports = function( grunt ) {
	'use strict';

	grunt.initConfig({
		uglify: {
			all: {
				files: {
					"dist/dwarf.min.js": [ "src/dwarf.js" ]
				},
				options: {
					preserveComments: false,
					sourceMap: "dist/dwarf.min.map",
					sourceMappingURL: "dwarf.min.map",
					report: "gzip",
					beautify: {
						ascii_only: true
					},
					banner: "/*! webkit-dwarf Copyright(c) 2013 Daniel Yang <miniflycn@gmail.com> MIT Licensed */",
					compress: {
						hoist_funs: false,
						loops: false,
						unused: false
					}
				}
			}
		},
		copy: {
			test: {
				files: [
					{expand: true, cwd: 'src/', src: ['*'], dest: 'test/js/'}
				]
			}
		},
		mocha_phantomjs: {
			options: {
				'reporter': 'xunit',
				'output': 'tests/results/result.xml'
			},
			all: ['test/*.html']
		}
	});

	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-mocha-phantomjs');

	grunt.registerTask('default', ['uglify', 'copy', 'mocha_phantomjs']);
};