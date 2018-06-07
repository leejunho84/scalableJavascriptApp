var gulp = require('gulp');
var concat = require('gulp-concat');
var browserSync = require('browser-sync').create();

gulp.task('server', ['build-libs', 'build-core'], function () {
    return browserSync.init({
        server: {
            baseDir: './dist'
        }
    });
});

gulp.task('build-core', function () {
    return gulp.src(['src/js/core.js', 'src/js/components/**/*.js', 'src/js/modules/**/*.js'])
        .pipe(concat('index.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('build-libs', function () {
    return gulp.src('src/js/vendor/**/*.js')
        .pipe(concat('libs.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['build-core']);
});

gulp.task('start', ['server', 'watch']);
