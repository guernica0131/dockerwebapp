module.exports = function(grunt) {
    grunt.config.set('bower', {
        dev: {
            dest: '.tmp/public',
            js_dest: '.tmp/public/js',
            css_dest: '.tmp/public/styles',
            // install: {
            // 	 "angular": "~1.3.0",
            // },
            options: {
            	
                // packageSpecific: {
                //     'angular': {
                //         keepExpandedHierarchy: true,
                //         stripGlobBase: true,
                //         files: [
                //             'angular/angular.min.js',
                            
                //         ]
                //     }
                // }
            }

        }
    });

    grunt.loadNpmTasks('grunt-bower');
};