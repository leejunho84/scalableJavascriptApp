var gulp = require('gulp');
var concat = require('gulp-concat');
var browserSync = require('browser-sync').create();

gulp.task('server', ['build'], function () {
    return browserSync.init({
        server: {
            baseDir: './dist'
        }
    });
});

gulp.task('build', function () {
    return gulp.src('src/**/*.js')
        .pipe(concat('index.js'))
        .pipe(gulp.dest('dist/js'))
        .pipe(browserSync.reload({stream:true}));
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['build']);
});

gulp.task('start', ['server', 'watch']);
