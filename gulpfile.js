var gulp = require('gulp'),
	sass = require('gulp-sass'),
	browserSync = require('browser-sync'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglifyjs'),
	saveLicense = require('uglify-save-license'),
	cssnano = require('gulp-cssnano'),
	rename = require('gulp-rename'),
	del = require('del'),
	imagemin = require('gulp-imagemin'),
	pngquant = require('imagemin-pngquant'),
	cache = require('gulp-cache'),
	autoprefixer = require('gulp-autoprefixer'),
	sourcemaps = require('gulp-sourcemaps'),
	babel = require("gulp-babel"),
	spritesmith = require('gulp.spritesmith'),
	pagebuilder = require('gulp-pagebuilder'),
	svgstore = require('gulp-svgstore'),
	inject = require('gulp-inject'),
	svgmin = require('gulp-svgmin'),
	path = require('path'),
	cheerio = require('gulp-cheerio'),
	stripCssComments = require('gulp-strip-css-comments'),
	removeEmptyLines = require('gulp-remove-empty-lines'),
	htmlhint = require("gulp-htmlhint"),
	replace = require('gulp-replace'),
	dirSep = require('path').sep,
	prettify = require('gulp-html-prettify');

// Manual task
gulp.task('fonts', function () {
	var fontStyles = gulp.src('app/fontssource/**/stylesheet.css')
		.pipe(concat('_fonts.scss'))
		.pipe(replace("url('", "url('../fonts/"))
		.pipe(gulp.dest('app/scss'));

	var repfonts = gulp.src('app/fontssource/**/*.{eot,ttf,svg,woff,woff2}')
		.pipe(rename(function (path) {
			var dirs = path.dirname.split(dirSep);
			dirs.splice(0, 1);
			path.dirname = dirs.join(dirSep);
		}))
		.pipe(gulp.dest('app/fonts'));
});

gulp.task('htmlhint', function () {
	gulp.src("./app/*.html")
		.pipe(htmlhint('.htmlhintrc'))
		.pipe(htmlhint.reporter());
});

gulp.task('svgstore', function () {
	var svgs = gulp
		.src('app/icons/svg/*.svg')
		.pipe(cheerio({
			run: function ($) {
				$('[fill]').removeAttr('fill');
			},
			parserOptions: { xmlMode: true }
		}))
		.pipe(svgmin(function (file) {
			var prefix = path.basename(file.relative, path.extname(file.relative));
			return {
				plugins: [{
					cleanupIDs: {
						prefix: prefix + '-',
						minify: true
					}
				}]
			};
		}))
		.pipe(svgstore({ inlineSvg: true }));

	function fileContents(filePath, file) {
		return file.contents.toString();
	}

	return gulp
		.src('app/icons/svg/svg-sprite.html')
		.pipe(inject(svgs, { transform: fileContents }))
		.pipe(gulp.dest('./app/modules'));
});

gulp.task('sass', function () {
	return gulp.src('app/scss/**/*.scss')
		.pipe(sourcemaps.init())
		.pipe(sass({ outputStyle: 'compact' }).on('error', sass.logError))
		.pipe(autoprefixer(['last 15 versions', '> 1%', 'ie 8', 'ie 7', 'Firefox ESR', 'android 4'], { cascade: true }))
		.pipe(stripCssComments({ preserve: /^\*|^\!/ }))
		.pipe(removeEmptyLines())
		.pipe(sourcemaps.write('../maps'))
		.pipe(gulp.dest('app/css'))
		.pipe(browserSync.reload({ stream: true }));
});

gulp.task('browser-sync', function () {
	browserSync({
		server: {
			baseDir: 'app',
			index: "index.html"
		},
		notify: true
	});
});

gulp.task('pagebuilder', function () {
	return gulp.src('app/pages/*.html')
		.pipe(pagebuilder('app/modules'))
		.pipe(prettify())
		.pipe(gulp.dest('app/'))
		.pipe(htmlhint('.htmlhintrc'))
		.pipe(htmlhint.reporter());
});

gulp.task('html-watch', ['pagebuilder'], function (done) {
    browserSync.reload();
    done();
});

gulp.task('sprites', function () {
	var spriteData =
		gulp.src('./app/icons/*.*')
			.pipe(spritesmith({
				imgName: 'sprite.png',
				cssName: '_sprite.scss',
				cssFormat: 'scss',
				imgPath: "../img/sprite.png",
				algorithm: 'binary-tree',
				cssVarMap: function (sprite) {
					sprite.name = 's-' + sprite.name;
				}
			}));

	spriteData.img.pipe(gulp.dest('./app/img/'));
	spriteData.css.pipe(gulp.dest('./app/scss/'));
});

gulp.task('babel', function () {
	return gulp.src('app/js/es6/*.js')
		.pipe(babel({
			presets: ['es2015']
		}))
		.on('error', function (e) {
			console.log('>>> ERROR', e);
			// emit here
			this.emit('end');
		})
		.pipe(gulp.dest('app/js'))
		.pipe(browserSync.reload({ stream: true }));
});

gulp.task('scripts', function () {
	return gulp.src([
		'app/libs/jquery/dist/jquery.min.js',
	])
		.pipe(concat('jquery.min.js'))
		.pipe(uglify({
			output: {
				comments: saveLicense
			}
		}))
		.pipe(gulp.dest('app/js')),

		// Plugins including
		gulp.src([
			'app/libs/fancybox/source/jquery.fancybox.js',
			'app/libs/slick-carousel/slick/slick.min.js',
			'app/libs/malihu-custom-scrollbar-plugin/jquery.mCustomScrollbar.js'
		])
			// .pipe(uglify({
			//           output: {
			//               comments: saveLicense
			//           }
			//       }))
			.pipe(concat('plugins.js'))
			//.pipe(rename('plugins.js'))
			//.pipe(replace(",/*", ",\n/*"))
			.pipe(gulp.dest('app/js'));
});


gulp.task('css-libs', ['sass'], function () {
	return gulp.src('app/css/libs.css')
		.pipe(cssnano())
		.pipe(rename({ suffix: '.min' }))
		.pipe(gulp.dest('app/css'));
});

gulp.task('watch', ['browser-sync', 'svgstore', 'pagebuilder', 'sprites', 'css-libs', 'scripts'], function () {
	gulp.watch('app/icons/svg/*.svg', ['svgstore']);
	gulp.watch('app/scss/**/*.scss', ['sass']);
	gulp.watch('app/js/es6/*.js', ['babel']);
	gulp.watch('app/libs/**/*.js', ['scripts']);
	gulp.watch('app/icons/*.*', ['sprites']);
	gulp.watch('app/modules/**/*.html', ['html-watch']);
	gulp.watch('app/pages/*.html', ['html-watch']);
});

gulp.task('clean', function () {
	return del.sync('build');
});

gulp.task('img', function () {
	return gulp.src('app/img/**/*')
		.pipe(cache(imagemin({
			interlaced: true,
			progressive: true,
			svgoPlugins: [{ removeViewBox: false }],
			use: [pngquant()]
		})))
		.pipe(gulp.dest('build/img'));
});

gulp.task('build', ['clean', 'sprites', 'img', 'sass', 'babel', 'scripts'], function () {

	var buildCss = gulp.src([
		'app/css/main.css',
		'app/css/libs.min.css'
	])
		.pipe(gulp.dest('build/css'));

	var buildFonts = gulp.src('app/fonts/**/*')
		.pipe(gulp.dest('build/fonts'));

	var buildJs = gulp.src('app/js/*.js')
		.pipe(gulp.dest('build/js'));

	var buildHtml = gulp.src('app/*.html')
		.pipe(gulp.dest('build'));

});

// Manual task
gulp.task('clear', function (callback) {
	return cache.clearAll();
});

gulp.task('default', ['watch']);
