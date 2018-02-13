//SRCSET REQUIREMENTS
var gulp    = require( 'gulp' );
var fs      = require('fs');
var path    = require('path');
var cheerio = require('cheerio');
var glob    = require("glob");
var im      = require('imagemagick');
var del     = require( 'del' );
var gutil            = require( 'gulp-util' );

///////////////////
// CONFIGURATION //
///////////////////
var paths = {
  img: './srcimages/',
  html: './tpl/*.html',
  dist: './dist',
  pub_dist: './dist/public',
  tmp: './tmp/'
};

var srcsetOptions = {
  srcDir: './srcimages/',
  targetDir: './tmp/',
  globOptions: null,
  imgQuality: 0.8
}

var imgTotal = 0;
var imgResized = 0;


// Deleting all dist content
gulp.task( 'clean', function() {
  return del.sync( 'dist' );
});

// Generate image with SRCSET attributes
gulp.task( 'srcset', function() {

  del.sync('tmp/*.jpg', 'tmp/*.png', 'tmp/*.gif', 'tmp/*.jpeg');

  // options is optional 
  glob("tpl/*.html", srcsetOptions.globOptions, function (er, files) {
    
    for(filenames in files)
    {
      gutil.log('SRCSET', gutil.colors.cyan('HTML FILE FOUND'), gutil.colors.magenta(files[filenames]));
      /*** load html file ***/
      var $ = cheerio.load(fs.readFileSync(files[filenames]));
      
      /*** loop on each img ***/
      $('img').each(function(i, elem)
      {
        imgTotal++;

        var images = $(this).attr('srcset');
        if(typeof images !== "undefined" && images.length > 0)
        {
          var imgSrc = $(this).attr('src');
          var baseSrc = imgSrc.replace('_'+getResizeValue(imgSrc), '');
          
          if(baseSrc.indexOf('/') >= 0)
            baseSrc = baseSrc.split('/').pop();
          
          if(baseSrc.indexOf('?') >= 0)
            baseSrc = baseSrc.split('?').shift();

          baseSrc = paths.img+baseSrc;
          
          gutil.log('SRCSET', gutil.colors.cyan('IMAGE TO RESIZE'), gutil.colors.magenta(baseSrc));
          
          fs.stat(baseSrc, function(err, stat)
          {
            if(err == null)
            {
                var srcsetList = images.split(",");
                var checkResize = new Array();
              /*** list the srcset files ***/
              for(srcsetItems in srcsetList)
              {
                var srcset = srcsetList[srcsetItems];
                var srcsetArray = srcset.trim().split(" ");
                var srcsetPath = srcsetArray[0];

                // srcsetPath = srcsetPath.replace('/public/', '');
                srcsetPath = srcsetPath.split('/').pop();
                srcsetPath = srcsetPath.split('?').shift();

                // check if already resized
                if(checkResize.indexOf(srcsetPath) < 0 )
                {
                  checkResize.push(srcsetPath);

                  srcsetPath = srcsetOptions.targetDir+srcsetPath;

                  gutil.log('SRCSET', gutil.colors.cyan('RESIZED IMAGE'), gutil.colors.magenta(srcsetPath));

                  var resize = getResizeValue(srcsetArray[0]);
                  
                  if(resize.indexOf('x') >= 0)
                  {
                    var size = resize.replace('x', '');
                    // launch resize
                    resizeImages(baseSrc, srcsetPath, size, resize.indexOf("x"));
                  }
                  else
                  {
                    //srcset detected but no resize needed, just copy image
                    gutil.log('SRCSET', gutil.colors.cyan('NOTHING TO RESIZE, JUST MV'), gutil.colors.magenta(baseSrc));
                    gulp.src(baseSrc).pipe(gulp.dest(srcsetOptions.targetDir));
                  }   
                }
              }
            }
            else
            {
              //image source missing
              gutil.log('SRCSET', gutil.colors.bgRed('RESIZE FAILED : SOURCE FILE DOES NOT EXISTS'), gutil.colors.magenta(baseSrc));
            }
          });
        }
        else
        {
          //no srcset detected, just copy image

          var imgSrc = $(this).attr('src');
          var baseSrc = imgSrc.replace('_'+getResizeValue(imgSrc), '');
          
          baseSrc = baseSrc.split('/').pop();

          if(baseSrc.indexOf('?') >= 0)
            baseSrc = baseSrc.split('?').shift();

          baseSrc = srcsetOptions.srcDir+baseSrc;

          gutil.log('SRCSET', gutil.colors.cyan('NOTHING TO RESIZE, JUST MV'), gutil.colors.magenta(baseSrc));
          gulp.src(baseSrc).pipe(gulp.dest(srcsetOptions.targetDir));
        }
        
      });
      gutil.log('SRCSET', 'Total image founded in html', gutil.colors.magenta(imgTotal));
    }
  });

  gutil.log('SRCSET', 'Total resized images', gutil.colors.magenta(imgResized));
  
} );

/****** SRCSET FUNCTIONS ******/

//renvoi le filename sans extension
function getImageWithoutExt(str)
{
  var ext = str.split('.').pop();
  str = str.replace('.'+ext, '');
  return str;
}

//renvoi le param de resize du filename
function getResizeValue(str)
{
  str = getImageWithoutExt(str);
  str = str.split('_').pop();
  return str;
}

// resize images
function resizeImages(source, dest, size, type)
{
  if(type > 0) // width base resize
  {
    im.resize({
      srcPath: source,
      dstPath: dest,
      width:   size,
      quality: srcsetOptions.imgQuality
    }, function(err, stdout, stderr){
      if (err) {
        throw err;
      }
      gutil.log('SRCSET', gutil.colors.cyan(source)+' to', gutil.colors.magenta(dest), 'with a width of '+gutil.colors.yellow(size));
      imgResized++;
      // console.log('resized "'+source+'" to "'+dest+'" with a width of '+size);
    });
  }
  else // width base resize
  {
    im.resize({
      srcPath: source,
      dstPath: dest,
      height:   size,
      quality: srcsetOptions.imgQuality
    }, function(err, stdout, stderr){
      if (err) {
        throw err;
      }
      gutil.log('SRCSET', gutil.colors.cyan(source)+' to', gutil.colors.magenta(dest), 'with a height of '+gutil.colors.yellow(size));
      imgResized++;
      // console.log('resized "'+source+'" to "'+dest+'" with a height of '+size);
    });
  }
}