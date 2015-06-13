(function () {

  /**
   * @author Matt Colman http://mattcolman.com/ @matt_colman
   */
  MyPhotoAlbum = (function() {

    // common utility methods
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

    p.addPageLayouts = function() {
      var l = PageTypes.length
      var j = 0
      for (var i = 0; i < br.numPages; i++) {
        page = br.getPage(i)
        pageLayout = PageLayouts[PageTypes[j++%l]]

        for (var k = 0; k < pageLayout.length; k++) {
          rect = pageLayout[k]
          dropZone = new createjs.Container()
          dropZone.bounds = rect
          dropZone.set({x: rect.x, y: rect.y})
          page.addChild(dropZone)
          dropZones.push(dropZone)
        };
      };
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
        _this.addPageLayouts()
        _this.loadManifest(manifest)
      })
    }

    p.loadManifest = function(manifest) {
      queue = new createjs.LoadQueue(false);
      queue.on("fileload", createjs.proxy(this.handleFileLoad, this));
      queue.loadManifest(manifest, true);
    }

    createjs.Bitmap.prototype.fitInto = function(width, height) {
      scaleX = width / this.image.width;
      scaleY = height / this.image.height;
      this.scaleX = this.scaleY = Math.min(scaleX, scaleY);
    }

    p.handleFileLoad = function(e) {
      page = br.getPageContainer(e.currentTarget._numItemsLoaded-1)
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
      bmp.fitInto(dropZone.bounds.width, dropZone.bounds.height)
      bmp.x = (dropZone.bounds.width - bmp.image.width*bmp.scaleX) / 2
      bmp.y = (dropZone.bounds.height - bmp.image.height*bmp.scaleY) / 2
      dropZone.addChild(bmp)

      //this.drawPageLayout(page);
    }

    p.drawPageLayout = function(parent) {
      console.log("drawPageLayout")
      pageLayout = PageLayouts[PageTypes[0]]
      for (name in pageLayout) {
        rect = pageLayout[name];
        shape = this.makeRect(rect.width, rect.height, "#ff0000")
        shape.setTransform(rect.x, rect.y)
        parent.addChild(shape)
      }
    }

    p.makeRect = function(w, h, color) {
      g = new createjs.Graphics()
      g.beginStroke("#000000")
       .beginFill(color)
       .drawRect(0, 0, w, h)
      s = new createjs.Shape(g)
      return s;
    }

    return createjs.promote(MyPhotoAlbum, "EventDispatcher");

  })();

}());




