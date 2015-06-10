(function () {

  /**
   * @author Matt Colman http://mattcolman.com/ @matt_colman
   */
  MyPhotoAlbum = (function() {

    var stage;
    var stageWidth;
    var stageHeight;
    var br; // book reader
    var manifest;
    var queue;
    var completeHandler;

    CANVAS_WIDTH = 2000;
    CANVAS_HEIGHT = 700;

    BOOK_WIDTH = 1844;
    BOOK_HEIGHT = 700;

    DEFAULT_THEME = {background: "#ffffff"}
    /**
     * @constructor
     */
    function MyPhotoAlbum(feed, options) {
      if (options == null) options = {};
      this.feed = feed
      this.theme = (options.theme != null) ? options.theme : DEFAULT_THEME
      this.init()
    }

    var p = createjs.extend(MyPhotoAlbum, createjs.EventDispatcher);

  // public properties:
    p.debug = false; // debug turns of console logs and prints the page number.

  // public methods:
    p.init = function() {
      this.preloadAssets();
    };


    p.preloadAssets = function() {
      queue = new createjs.LoadQueue(false);
      completeHandler = createjs.proxy(this.handlePreloadAssetsComplete, this)
      queue.on("complete", completeHandler);
      assetPath = "./assets/images/"
      manifest = [
        {src: this.theme.background, id: "background"}
      ]
      queue.loadManifest(manifest, true, assetPath);
    }

    p.handlePreloadAssetsComplete = function() {
      queue.removeEventListener("complete", completeHandler)
      this.backgroundImage = queue.getResult("background");
      this.setupStage();
      this.addBookReader();
      this.addImages();
    }

    function getDevicePixelRatio() {
      var ratio;
      ratio = 1;
      if ((window.screen.systemXDPI != null) && (window.screen.logicalXDPI != null) && window.screen.systemXDPI > window.screen.logicalXDPI) {
        ratio = window.screen.systemXDPI / window.screen.logicalXDPI;
      } else if (window.devicePixelRatio != null) {
        ratio = window.devicePixelRatio;
      }
      return ratio;
    }

    p.setupStage = function() {
      var canvas = document.getElementById("maincanvas");
      stage = new createjs.Stage(canvas);
      stage.enableMouseOver();
      stageWidth = canvas.width;
      stageHeight = canvas.height;
      createjs.Ticker.addEventListener("tick", stage);

      // css
      canvas = $("#maincanvas")
      canvasElement = canvas[0]
      canvas.width(CANVAS_WIDTH)
      canvas.height(CANVAS_HEIGHT)

      pixelRatio = getDevicePixelRatio()
      canvasElement.width = CANVAS_WIDTH * pixelRatio
      canvasElement.height = CANVAS_HEIGHT * pixelRatio
    }

    p.addBookReader = function() {
      options = {
        numPages: 0,
        x: 0,
        y: 0,
        pageWidth: BOOK_WIDTH/2,
        pageHeight: BOOK_HEIGHT,
        pageGap: 0,
        startPage: 0,
        background: this.backgroundImage
      }

      cnt = new createjs.Container()
      stage.addChild(cnt)
      br = new BookReader(cnt, options)
      cnt.x = (2000 - BOOK_WIDTH)/2
    }

    p.addImages = function() {

      // TODO
      // var picasa = {
      //   username : 'your_Picasa_id',
      //   albumId : 'your_album_id',
      //   count : 14
      // }

      photoFeed = this.feed

      manifest = [];
      _this = this;
      $.getJSON(photoFeed, function(data) {
        console.log('hi data', data);
        $.each(data.feed.entry, function(index){
          manifest.push({src: data.feed.entry[index].content.src, id: data.feed.entry[index].title.$t});
        })
        numPages = manifest.length + manifest.length % 2; // must be even pages
        br.addBlankPages(numPages)
        _this.loadManifest(manifest)
      })
    }

    p.loadManifest = function(manifest) {
      queue = new createjs.LoadQueue(false);
      queue.on("fileload", createjs.proxy(this.handleFileLoad, this));
      queue.loadManifest(manifest, true);
    }

    // createjs.Bitmap.prototype.fitInto = function(width, height) {
    //   scaleX = width / this.image.width;
    //   scaleY = height / this.image.height;
    //   this.scaleX = this.scaleY = Math.min(scaleX, scaleY);
    // }

    p.handleFileLoad = function(e) {
      page = br.getPageContainer(e.currentTarget._numItemsLoaded-1)
      img = e.result
      bmp = new createjs.Bitmap(img)
      scaleX = br.pageWidth / img.width;
      scaleY = br.pageHeight / img.height;
      scale = Math.min(scaleX, scaleY);
      bmp.scaleX = bmp.scaleY = scale
      bmp.x = (br.pageWidth - img.width*scale)/2
      bmp.y = (br.pageHeight - img.height*scale)/2
      bmp.cache(0, 0, img.width, img.height, scale)

      page.addChild(bmp)
    }

    return createjs.promote(MyPhotoAlbum, "EventDispatcher");

  })();

}());




