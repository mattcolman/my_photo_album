(function () {

  /**
   * @author Matt Colman http://mattcolman.com/ @matt_colman
   * EaselJS (CreateJS) built photo album
   */

  /**
   * TODO
   * Use requirejs to split up classes and build a minified JS
   * Draw white borders on images
   * smart sort to put suitable images in suitable dropZones e.g. match portrait to portrait
   * choose the page layouts with a pattern of images per page. e.g. [1, 2, 4, 3, 2, 1]
     then wait on each page for all images to be loaded before determining which page layout to choose from
   * scale to fit screen
   * use SpriteStage for webgl
   * build a bootstrap front page with picasa login.
  */
  MyPhotoAlbum = (function() {

    // common utility methods
    // code taken from http://www.html5rocks.com/en/tutorials/canvas/hidpi/
    function getDevicePixelRatio() {
      context = stage.parent.canvas.getContext('2d')
      devicePixelRatio = window.devicePixelRatio || 1
      backingStoreRatio = context.webkitBackingStorePixelRatio ||
                          context.mozBackingStorePixelRatio ||
                          context.msBackingStorePixelRatio ||
                          context.oBackingStorePixelRatio ||
                          context.backingStorePixelRatio || 1
      ratio = devicePixelRatio / backingStoreRatio;
      return ratio;
    }

    function makeRect(w, h, color, strokeColor) {
      g = new createjs.Graphics()
      if (strokeColor != null) g.beginStroke(strokeColor);
       g.beginFill(color)
        .drawRect(0, 0, w, h)
      s = new createjs.Shape(g)
      return s;
    }

    function getStageScale(stageWidth, stageHeight) {
      docWidth = $(window).width()
      docHeight = $(window).height()
      //docHeight -= $("header").height()*2
      scaleWidth = docWidth / stageWidth
      scaleHeight = docHeight / stageHeight
      scale = Math.min(scaleWidth, scaleHeight)
      return scale;
    }

    createjs.Bitmap.prototype.fitInto = function(width, height) {
      scaleX = width / this.image.width;
      scaleY = height / this.image.height;
      this.scaleX = this.scaleY = Math.min(scaleX, scaleY);
    }

    var stage;
    var stageWidth;
    var stageHeight;
    var br; // book reader
    var manifest;
    var queue;
    var completeHandler;
    var dropZones = [];

    CANVAS_WIDTH = 2000;
    CANVAS_HEIGHT = 700;

    BOOK_WIDTH = 1844;
    BOOK_HEIGHT = 700;

    DEFAULT_THEME = {background: "#ffffff"}

    // Generated from Flash.
    PageTypes = ["1xAny", "4xLan", "2xPor", "1xLan+1xSqu"]
    PageLayouts = {
      "1xLan+1xSqu": [
        {x:252, y:14, width:657, height:493},
        {x:20, y:370, width:312, height:312}
      ],
      "1xAny": [
        {x:28, y:24, width:865, height:649}
      ],
      "2xPor": [
        {x:473, y:64, width:425, height:567},
        {x:28, y:64, width:425, height:567}
      ],
      "4xLan": [
        {x:42, y:26, width:415, height:311},
        {x:474, y:26, width:415, height:311},
        {x:42, y:358, width:415, height:311},
        {x:474, y:358, width:415, height:311}
      ]
    }
      // "1xLan"
      // "1xPor"
      // "1xSqu"
      // "2xPor"
      // "1xPor_2xLan"
      // "4xLan"
      // "1xLan_1xSqu"


    /**
     * @constructor
     */
    function MyPhotoAlbum(feed, parentDiv, options) {
      if (options == null) options = {};
      this.feed = feed
      this.theme = (options.theme != null) ? options.theme : DEFAULT_THEME
      this.parentDiv = parentDiv
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

    p.setupStage = function() {
      var canvas = $('<canvas>')
      var canvasElement = canvas[0]
      $("#"+this.parentDiv).append(canvas)
      var easelStage = new createjs.Stage(canvasElement);
      easelStage.enableMouseOver();
      createjs.Ticker.addEventListener("tick", easelStage);
      stage = new createjs.Container()
      easelStage.addChild(stage)

      pixelRatio = getDevicePixelRatio()
      stageScale = getStageScale(CANVAS_WIDTH, CANVAS_HEIGHT)
      // css
      canvasWidth = CANVAS_WIDTH*stageScale
      canvasHeight = CANVAS_HEIGHT*stageScale
      canvas.width(canvasWidth)
      canvas.height(canvasHeight)
      $("#background").css("width", canvasWidth+"px")

      canvasElement.width = canvasWidth * pixelRatio
      canvasElement.height = canvasHeight * pixelRatio

      stage.scaleX = stage.scaleY = stageScale*pixelRatio
      console.log('stageScale', stageScale)
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
        pageLayouts = _this.getPageLayouts(manifest.length)
        br.addBlankPages(pageLayouts.length - br.allPages.length)
        _this.addPageLayouts(pageLayouts)
        _this.loadManifest(manifest)
      })
    }

    p.getPageLayouts = function(numImages) {
      console.log("numImages", numImages)
      var l = PageTypes.length
      var pageLayouts = []
      numPages = 0
      while (numImages > 0) {
        pageLayout = PageLayouts[PageTypes[numPages++%l]]
        numImages -= pageLayout.length
        pageLayouts.push(pageLayout)
      }
      numPages = numPages + numPages%2 // must be even pages
      return pageLayouts
    }

    p.addPageLayouts = function(pageLayouts) {
      for (var i = 0; i < pageLayouts.length; i++) {
        page = br.getPage(i)
        pageCnt = br.getPageContainer(i)
        pageLayout = pageLayouts[i]

        for (var k = 0; k < pageLayout.length; k++) {
          rect = pageLayout[k]
          dropZone = new createjs.Container()
          dropZone.bounds = rect
          dropZone.set({x: rect.x, y: rect.y})
          pageCnt.addChild(dropZone)
          dropZones.push(dropZone)
        };
      };
    }

    p.loadManifest = function(manifest) {
      queue = new createjs.LoadQueue(false);
      queue.on("fileload", createjs.proxy(this.handleFileLoad, this));
      queue.loadManifest(manifest, true);
    }

    p.handleFileLoad = function(e) {
      img = e.result
      bmp = new createjs.Bitmap(img)
      // scaleX = br.pageWidth / img.width;
      // scaleY = br.pageHeight / img.height;
      // scale = Math.min(scaleX, scaleY);
      // bmp.scaleX = bmp.scaleY = scale
      // bmp.x = (br.pageWidth - img.width*scale)/2
      // bmp.y = (br.pageHeight - img.height*scale)/2
      // bmp.cache(0, 0, img.width, img.height, scale)

      //page.addChild(bmp);
      dropZone = dropZones.shift()
      border = 10
      doubleBorder = border*2
      w = dropZone.bounds.width - doubleBorder
      h = dropZone.bounds.height - doubleBorder
      bmp.fitInto(w, h)
      bmpWidth = bmp.image.width*bmp.scaleX
      bmpHeight = bmp.image.height*bmp.scaleY
      bmp.x = (w - bmpWidth) / 2
      bmp.y = (h - bmpHeight) / 2

      whiteBg = makeRect(bmpWidth + doubleBorder, bmpHeight + doubleBorder, "#ffffff")
      whiteBg.x = bmp.x - border
      whiteBg.y = bmp.y - border
      dropZone.addChild(whiteBg, bmp)

      //this.drawPageLayout(page);
    }

    // debug draw the drop zones
    p.drawPageLayout = function(parent) {
      console.log("drawPageLayout")
      pageLayout = PageLayouts[PageTypes[0]]
      for (name in pageLayout) {
        rect = pageLayout[name];
        shape = makeRect(rect.width, rect.height, "#ff0000", "#000000")
        shape.setTransform(rect.x, rect.y)
        parent.addChild(shape)
      }
    }

    return createjs.promote(MyPhotoAlbum, "EventDispatcher");

  })();

}());




