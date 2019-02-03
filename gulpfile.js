var gulp = require('gulp'),
  del = require('del'),
  jspm = require('gulp-jspm'),
  rename = require('gulp-rename'),
  runSequence = require('run-sequence'),
  minify = require('gulp-minify'),
  eslint = require('gulp-eslint'),
  gulpIf = require('gulp-if'),
  imagemin = require('gulp-imagemin')
  ;

gulp.task('default', function() {
  console.log('Please use the following gulp tasks: watch, clean, bundle, build');
});

gulp.task('clean', function() {
  return del('./dist', {
    force: true
  });
});

gulp.task('bundle-options', function() {
  return gulp.src('./lib/scripts/controllers/options.js')
    .pipe(jspm({
      selfExecutingBundle: true
    }))
    .pipe(rename('options.js'))
    .pipe(gulp.dest('./lib'));
});

gulp.task('bundle-popup', function() {
  return gulp.src('./lib/scripts/controllers/popup.js')
    .pipe(jspm({
      selfExecutingBundle: true
    }))
    .pipe(rename('popup.js'))
    .pipe(gulp.dest('./lib'));
});

gulp.task('bundle-event', function() {
  return gulp.src('./lib/scripts/eventPage.js')
    .pipe(jspm({
      selfExecutingBundle: true
    }))
    .pipe(rename('eventPage.js'))
    .pipe(gulp.dest('./lib'));
});

gulp.task('bundle-content', function() {
  return gulp.src('./lib/scripts/mtw.js')
    .pipe(jspm({
      selfExecutingBundle: true
    }))
    .pipe(rename('mtw.js'))
    .pipe(gulp.dest('./lib'));
});

gulp.task('watch', ['bundle-options', 'bundle-popup', 'bundle-content', 'bundle-event'], function() {
  gulp.watch('./lib/scripts/controllers/options.js', ['bundle-options']);
  gulp.watch('./lib/scripts/controllers/popup.js', ['bundle-popup']);
  gulp.watch('./lib/scripts/mtw.js', ['bundle-content']);
  gulp.watch('./lib/scripts/eventPage.js', ['bundle-event']);
  gulp.watch('./lib/scripts/services/*.js', ['bundle-content', 'bundle-event']);
  gulp.watch('./lib/scripts/utils/defaultStorage.js', ['bundle-options','bundle-event']);
  
});

gulp.task('minify', function () {
  return gulp.src('./lib/*.js')
    .pipe(minify({
      ext: {
        min: '.js'
      },
      noSource: true,
      mangle: false
    }))
    .pipe(gulp.dest('./dist'));
});

gulp.task('copy-dist', function () {
  gulp.src('./lib/_locales/**/*').pipe(gulp.dest('./dist/_locales/'));
  gulp.src('./lib/assets/**/*').pipe(gulp.dest('./dist/assets/'));
  gulp.src('./lib/styles/**/*').pipe(gulp.dest('./dist/styles/'));
  gulp.src('./lib/common/*').pipe(gulp.dest('./dist/common/'));
  gulp.src('./lib/views/**/*').pipe(gulp.dest('./dist/views/'));
  return gulp.src('./lib/manifest.json').pipe(gulp.dest('./dist/'));
});

gulp.task('build', function() {
  runSequence('clean', 'esLint', 'compress-images',
    ['bundle-content', 'bundle-options', 'bundle-event',
    'bundle-popup'], 'minify', 'copy-dist');
});


gulp.task('local-build', function() {
  runSequence('clean',
    ['bundle-content', 'bundle-options', 'bundle-event',
    'bundle-popup']);
});

gulp.task('esLint',()=>{
  gulp.src('./lib/scripts/**/*.js')
      .pipe(eslint())
      .pipe(eslint.format())
      .pipe(eslint.failAfterError())
      .on('error', function(err) {
        console.log("Run 'gulp-fix' in terminal to fix these errors"); 
        process.exit()
      });
})
function isFixed(file) {
  return file.eslint != null && file.eslint.fixed;
}
gulp.task('fix', function () {
  return gulp.src('./lib/scripts/**/*.js')
      .pipe(eslint({fix:true}))
      .pipe(eslint.format())
      .pipe(gulpIf(isFixed, gulp.dest('lib/scripts/')))
      .pipe(eslint.failAfterError());
});
gulp.task('compress-images', () => {
  gulp.src('lib/assets/img/*')
     .pipe(imagemin())
     .pipe(gulp.dest('dist/assets/img'))
});
