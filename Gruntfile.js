module.exports = function( grunt ) {
	"use strict";

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
					report: "min",
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
		}
	});

	// Load grunt tasks from NPM packages
	grunt.loadNpmTasks('grunt-contrib-uglify');

	grunt.registerTask("default", [ "uglify" ]);
};