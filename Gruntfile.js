module.exports = function(grunt) {

	grunt.initConfig({

		// Import package manifest
		pkg: grunt.file.readJSON("package.json"),

		// Banner definitions
		meta: {
			banner: "/*\n" +
			" *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
			" *  <%= pkg.description %>\n" +
			" *  <%= pkg.homepage %>\n" +
			" *\n" +
			" *  Made by <%= pkg.author %>\n" +
			" *  Under <%= pkg.licenses[0].type %> License\n" +
			" */\n"
		},

		// Concat definitions
		concat: {
			dist: {
				files : {
					"dist/dmak.js" : ["src/dmak.js", "src/dmakLoader.js"],
					"dist/jquery.dmak.js" : ["src/jquery.dmak.js"],
				}
			},
			options: {
				banner: "<%= meta.banner %>",
			}
		},

		// Lint definitions
		jshint: {
			files: ["src/dmakLoader.js", "src/dmak.js", "src/jquery.dmak.js"],
			options: {
				jshintrc: ".jshintrc"
			}
		},

		// Minify definitions
		uglify: {
			my_target: {
				files: {
					"dist/dmak.min.js" : "dist/dmak.js",
					"dist/jquery.dmak.min.js" : "dist/jquery.dmak.js",
				}
			},
			options: {
				banner: "<%= meta.banner %>",
				report: 'gzip'
			}
		}
	});

	grunt.loadNpmTasks("grunt-contrib-concat");
	grunt.loadNpmTasks("grunt-contrib-jshint");
	grunt.loadNpmTasks("grunt-contrib-uglify");

	grunt.registerTask("default", ["jshint", "concat", "uglify"]);
	grunt.registerTask("travis", ["jshint"]);
};
