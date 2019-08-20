const gulp = require('gulp'),
  del = require('del'),
  jspm = require('gulp-jspm'),
  rename = require('gulp-rename'),
  runSequence = require('run-sequence'),
  minify = require('gulp-minify'),
  replace = require('gulp-replace'),
  eslint = require('gulp-eslint'),
  gulpIf = require('gulp-if'),
  imagemin = require('gulp-imagemin');

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
    .pipe(gulp.dest('./dist/chrome'));
});

gulp.task('copy-dist', function () {
  gulp.src('./lib/_locales/**/*').pipe(gulp.dest('./dist/chrome/_locales/'));
  gulp.src('./lib/assets/**/*').pipe(gulp.dest('./dist/chrome/assets/'));
  gulp.src('./lib/styles/**/*').pipe(gulp.dest('./dist/chrome/styles/'));
  gulp.src('./lib/common/*').pipe(gulp.dest('./dist/chrome/common/'));
  gulp.src('./lib/views/**/*').pipe(gulp.dest('./dist/chrome/views/'));
  return gulp.src('./lib/manifest.json').pipe(gulp.dest('./dist/chrome/'));
});

gulp.task('build', function() {
  runSequence('clean', 'esLint', 'compress-images',
    ['bundle-content', 'bundle-options', 'bundle-event',
      'bundle-popup'], 'minify', 'copy-dist', 'replace-secondary', 'copy-secondary');
});


gulp.task('local-build', function() {
  runSequence('clean',
    ['bundle-content', 'bundle-options', 'bundle-event',
      'bundle-popup']);
});

gulp.task('esLint',() => {
  gulp.src('./lib/scripts/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format())
    .pipe(eslint.failAfterError())
    .on('error', function(err) {
      console.log('Run "gulp-fix" in terminal to fix these errors');
      process.exit();
    });
});

gulp.task('replace-secondary', function() {
  gulp.src('./dist/chrome/*.js')
    .pipe(replace('chrome.', 'browser.'))
    .pipe(gulp.dest('./dist/firefox'));
});

gulp.task('copy-secondary', function() {
  // remove unsupported manifest properties in firefox
  gulp.src('./lib/manifest.json')
    .pipe(replace('"tts",', ''))
    .pipe(replace(`,
    "persistent": false`, ''))
    .pipe(replace('"key": "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAt8sOp84U8vR8eudy6JiiJtnjpEwEfmSKoEbWPSoCpf4OwlTyluUCwOBuqyc7uRRrPurWBj84OAZWewHnsJoSQs5NV0JzWsSrsv5GVv33cfJkRL4Zn77PzrF5fE53uI8E0ueA4ynGLVZ7DhjjIQjwCfVdZdsh1+4ZPKURjF0XZ7olK3z00EMNqHFdMqsv8R1Dkz9M1Oj2OoEiHMwE3sZD2tFtSaxnO/PqemsZLYhIUXSz9EreDXmD6qtlOGphUPCmJ0P4915HGwPJx7V84vXGf6KJf1GEy3uo2t+hJsCTZ0dDC6UBrltWd0ug+zD9QE/YnmWT069yUEfqXy6LmxlRgQIDAQAB",', ''))
    .pipe(replace('"options_page": "views/options.html",', '"options_ui": {"page": "views/options.html"},'))
    .pipe(gulp.dest('./dist/firefox/'));

  // copy commons
  gulp.src('./lib/_locales/**/*').pipe(gulp.dest('./dist/firefox/_locales/'));
  gulp.src('./lib/assets/**/*').pipe(gulp.dest('./dist/firefox/assets/'));
  gulp.src('./lib/styles/**/*').pipe(gulp.dest('./dist/firefox/styles/'));
  gulp.src('./lib/common/*').pipe(gulp.dest('./dist/firefox/common/'));
  gulp.src('./lib/views/**/*').pipe(gulp.dest('./dist/firefox/views/'));
});

function isFixed(file) {
  return file.eslint !== null && file.eslint.fixed;
}

gulp.task('fix', function () {
  return gulp.src('./lib/scripts/**/*.js')
    .pipe(eslint({ fix: true }))
    .pipe(eslint.format())
    .pipe(gulpIf(isFixed, gulp.dest('lib/scripts/')))
    .pipe(eslint.failAfterError());
});

gulp.task('compress-images', () => {
  gulp.src('lib/assets/img/*')
    .pipe(imagemin())
    .pipe(gulp.dest('dist/assets/img'));
});
