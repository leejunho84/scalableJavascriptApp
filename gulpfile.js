var gulp = require('gulp');
var concat = require('gulp-concat');
var browserSync = require('browser-sync').create();

//dist 폴더를 기준으로 웹서버 실행
gulp.task('server', ['build'], function () {
    return browserSync.init({
        server: {
            baseDir: './dist'
        }
    });
});

gulp.task('build', function () {
    return gulp.src('src/**/*.js') //src 폴더 아래의 모든 js 파일을
        .pipe(concat('index.js')) //병합하고
        .pipe(gulp.dest('dist/js')) //dist 폴더에 저장
        .pipe(browserSync.reload({stream:true})); //browserSync 로 브라우저에 반영
});

gulp.task('watch', function () {
    gulp.watch('src/**/*.js', ['build']);
});

gulp.task('start', ['server', 'watch']);
