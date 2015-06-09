(function () {

  /**
   * @author Matt Colman http://mattcolman.com/ @matt_colman
   */
  BookReader = (function() {
    /**
     * @class BookReader
     *
     * @example
     * options = {
     *   numPages: 6,
     *   x: 0,
     *   y: 0,
     *   pageWidth: 500,
     *   pageHeight: 700,
     *   pageGap: 0,
     *   startPage: 0
     * }
     *
     * cnt = new createjs.Container()
     * stage.addChild(cnt)
     * br = new BookReader(cnt, options)
     *
     * @constructor
     */
    function BookReader(container, options) {
      this.container = container;
      if (options == null) options = {};
      this.init(options);
    }

    var p = createjs.extend(BookReader, createjs.EventDispatcher);

  // public properties:
    p.debug = false; // debug turns of console logs and prints the page number.

  // public methods:
    // initialize the book with hash of options.
    p.init = function(options) {
      this.x          = options.x != null          ? options.x          : 0;
      this.y          = options.y != null          ? options.y          : 0;
      this.pageWidth  = options.pageWidth != null  ? options.pageWidth  : 500;
      this.pageHeight = options.pageHeight != null ? options.pageHeight : 700;
      this.pageGap    = options.pageGap != null    ? options.pageGap    : 0;
      this.bookWidth  = options.bookWidth != null  ? options.bookWidth  : this.pageWidth * 2 + this.pageGap;
      numPages        = options.numPages != null   ? options.numPages   : 2;
      startPage       = options.startPage != null  ? options.startPage  : 0;

      numPages = Math.max(numPages, 2); // minimum of 2 pages.

      // this._shadowLeft  = this._makeGradient(this.pageWidth, this.pageHeight, createjs.Graphics.getRGB(255, 0, 0, 1), createjs.Graphics.getRGB(255, 0, 0, 0))
      // this._shadowRight = this._makeGradient(this.pageWidth, this.pageHeight, createjs.Graphics.getRGB(255, 0, 0, 0), createjs.Graphics.getRGB(255, 0, 0, 1))
      this._shadowLeftBlack = this._makeGradient(this.pageWidth, this.pageHeight, createjs.Graphics.getRGB(0, 0, 0, 1), createjs.Graphics.getRGB(0, 0, 0, 1))
      this._shadowRightBlack = this._shadowLeftBlack.clone()
      this.masks = [];
      this.numPages = 0;
      this.allPages = [];
      this.currentPageNo = startPage - startPage % 2;
      this.addBlankPages(numPages);
      this._setupClickObject();
      this.showPage(this.currentPageNo);
    };


    // show page by index
    p.showPage = function(i) {
      var j, k, ref, ref1, ref2;
      for (j = k = ref = this.currentPageNo, ref1 = this.currentPageNo + 1; ref <= ref1 ? k <= ref1 : k >= ref1; j = ref <= ref1 ? ++k : --k) {
        this.allPages[j].visible = false;
      }
      this.currentPageNo = i;
      this.allPages[i].visible = true;
      return (ref2 = this.allPages[i + 1]) != null ? ref2.visible = true : void 0;
    };

    // dynamically add new blank pages to the end of the book
    p.addBlankPages = function(num) {
      if (num % 2) num++;
      for (var i = 0; i < num; i++) this.addBlankPage()
    };

    // dynamically add a new blank to the end of the book
    p.addBlankPage = function() {
      var page = new Page(this, {
        width: this.pageWidth,
        height: this.pageHeight
      });
      page.set({
        x: this.x + this.numPages % 2 * (this.pageWidth + this.pageGap),
        y: this.y
      });
      page.visible = false;
      page.clickable = true;
      this.container.addChild(page);
      this.allPages.push(page);
      this.numPages++;
    };

    // get page by index
    // @returns class Page
    p.getPage = function(i) {
      return this.allPages[i];
    };

    // get the page container by index
    // @returns createjs.Container
    p.getPageContainer = function(i) {
      return this.allPages[i].container;
    }

    // turn the current page by direction
    // 1 (forword) or -1 (backward)
    p.turnPage = function(direction) {
      var grad, increment, k, leftMask, leftPage, len, mask, pageNo, ref, rightMask, rightPage, time;
      increment = direction * 2;
      pageNo = this.currentPageNo + increment;
      if (pageNo < 0 || pageNo > this.numPages - 1) {
        if (this.debug) console.log('BookReader: No more pages this way!!');
        return;
      }
      //this.playSound('page turn');
      time = .4;
      //time = 5
      rightPage = this.allPages[pageNo + 1];
      leftPage = this.allPages[pageNo];

      if (this.debug) console.log('BookReader: show pages', leftPage.pageNumber, rightPage.pageNumber);

      this.container.addChild(rightPage, leftPage);
      rightPage.visible = true;
      leftPage.visible = true;
      ref = this.masks;
      for (k = 0, len = ref.length; k < len; k++) {
        mask = ref[k];
        this.container.removeChild(mask);
      }
      if (direction === 1) {
        leftMask = this._addMask(this.x, this.y, "left");
        rightMask = this._addMask(this.x + this.bookWidth, this.y, "right");
        TweenMax.to(leftMask, time, {
          x: this.x - this.bookWidth + this.pageWidth + this.pageGap / 2,
          ease: Power2.easeOut
        });
        TweenMax.to(rightMask, time, {
          x: this.x + this.pageWidth + this.pageGap / 2,
          ease: Power2.easeOut
        });
        TweenMax.from(leftPage, time, {
          x: this.getWidth() - this.pageWidth/2,
          ease: Power2.easeOut
        });
        // grad = this._shadowRight
        // grad.regX = this.pageWidth;
        // rightPage.addChild(grad);

        currentLeftPage = this.allPages[this.currentPageNo];
        currentLeftPage.addChild(this._shadowLeftBlack.set({alpha:1}));
        TweenMax.from(this._shadowLeftBlack, time*.8, {delay: time*.2, alpha: 0, ease: Power2.easeOut})

        rightPage.addChild(this._shadowRightBlack.set({alpha:1}));
        TweenMax.to(this._shadowRightBlack, time*.8, {alpha: 0, ease: Power2.easeOut})
      } else {
        leftMask = this._addMask(this.x - this.bookWidth, this.y, "left");
        rightMask = this._addMask(this.x, this.y, "right");
        TweenMax.to(leftMask, time, {
          x: this.x - this.bookWidth + this.pageWidth + this.pageGap / 2,
          ease: Power2.easeOut
        });
        TweenMax.to(rightMask, time, {
          x: this.x + this.pageWidth + this.pageGap / 2,
          ease: Power2.easeOut
        });
        TweenMax.from(rightPage, time, {
          x: this.x - this.pageWidth,
          ease: Power2.easeOut
        });
        // grad = this._shadowLeft
        // leftPage.addChild(grad);

        currentRightPage = this.allPages[this.currentPageNo+1];
        currentRightPage.addChild(this._shadowRightBlack.set({alpha:1}));
        TweenMax.from(this._shadowRightBlack, time*.8, {delay: time*.2, alpha: 0, ease: Power2.easeOut})

        leftPage.addChild(this._shadowLeftBlack.set({alpha:1}));
        TweenMax.to(this._shadowLeftBlack, time*.8, {alpha: 0, ease: Power2.easeOut})
      }
      leftPage.mask = leftMask;
      rightPage.mask = rightMask;
      // grad.scaleX = .5;
      // TweenMax.to(grad, time * .9, {
      //   scaleX: 1,
      //   alpha: 0,
      //   ease: Power3.easeOut
      // });
      //this.stage.mouseEnabled = false;
      TweenMax.delayedCall(time, (function(_this) {
        return function() {
         // _this.stage.mouseEnabled = true;
          _this.showPage(pageNo);
          _this.dispatchEvent("page-turn", _this.currentPageNo, _this.currentPageNo - increment);
        };
      })(this));
    };

    // get book's width
    p.getWidth = function() {
      return this.bookWidth;
    };

    // get book's height
    p.getHeight = function() {
      return this.pageHeight;
    };



    // ------------- PRIVATE ------------- \\
    // @private
    p._setupClickObject = function() {
      var clicker;
      clicker = this._makeSolid(this.getWidth(), this.getHeight(), createjs.Graphics.getRGB(255, 0, 0, 3/255))
      this.container.addChild(clicker);
      clicker.addEventListener("mousedown", createjs.proxy(this._handleMouseDown, this))
      clicker.addEventListener("click", createjs.proxy(this._handleMouseUp, this))
    };

    // @private
    _findClickable = function(o) {
      while (o) {
        if (o.clickable) {
          return o;
        }
        o = o.parent;
      }
      return null;
    };

    // @private
    p._handleMouseDown = function(e) {
      this.startX = e.stageX;
    };

    // @private
    p._handleMouseUp = function(e) {
      var threshold = 50;
      var endX = e.stageX;
      var distance = endX - this.startX;
      if (distance > threshold) {
        this.turnPage(-1);
      } else if (distance < -threshold) {
        this.turnPage(1);
      } else {
        var objUnderPoint;
        objects = this.container.getObjectsUnderPoint(e.stageX, e.stageY);
        for (k = 0, len = objects.length; k < len; k++) {
          possibleCarousel = objects[k];
          clickable = _findClickable(possibleCarousel);
          if ((clickable != null) && clickable.parent.visible) {
            objUnderPoint = clickable;
            break;
          }
        }
        if (objUnderPoint != null) {
          this._handleClick(objUnderPoint);
        }
      }
    };

    // handles a click (not a swipe)
    // this allows display objects inside the book
    // to be clickable. A click event is dispatched.
    // @private
    p._handleClick = function(target) {
      if (target.pageNumber != null) {
        this.turnPage(-1 + target.pageNumber%2*2)
      }
      this.dispatchEvent("click", target);
    };

    // @private
    _makeRect = function(w, h, color) {
      g = new createjs.Graphics()
      g.beginFill(color)
       .drawRect(0, 0, w, h)
      s = new createjs.Shape(g)
      return s;
    }

    // @private
    p._addMask = function(x, y, side) {
      var color = side === "left" ? "#ff0000" : "#ffff00";
      var w = this.bookWidth;
      var h = this.pageHeight;
      var mask = _makeRect(w, h, color);
      mask.alpha = .3;
      mask.set({
        x: x,
        y: y
      });
      this.masks.push(mask);
      return mask;
    };

    // @private
    p._makeGradient = function(w, h, c1, c2) {
      g = new createjs.Graphics();
      g.beginLinearGradientFill([c1, c2], [0, 1], 0, 0, w, 0).drawRect(0, 0, w, h);
      s = new createjs.Shape(g);
      return s;
    };

    // @private
    p._makeSolid = function(w, h, c) {
      g = new createjs.Graphics();
      g.beginFill(c)
       .drawRect(0, 0, w, h);
      s = new createjs.Shape(g);
      return s;
    }

    return createjs.promote(BookReader, "EventDispatcher");

  })();




  // Page class
  Page = (function () {

    function Page(book, bounds) {
      this.Container_constructor();
      this.initialize();

      this.book = book;
      this.bounds = bounds;
      var white = _makeRect(this.bounds.width, this.bounds.height, "#ffffff");
      this.addChild(white);
      var gradWidth = 40;
      if (book._gradientImage == null) {
        book._gradientImage = this._makeGradient(gradWidth, this.bounds.height)
      }
      var grad = new createjs.Bitmap(book._gradientImage)
      if (this.book.numPages % 2) {
        grad.scaleX = 1;
      } else {
        grad.x = this.bounds.width;
        grad.scaleX = -1;
      }
      this.container = new createjs.Container();
      this.addChild(this.container, grad);
      this.pageNumber = this.book.numPages;
      if (this.book.debug) {
        this.showPageNumber(this.pageNumber);
      }
    }

    var p2 = createjs.extend(Page, createjs.Container);

    // debug only
    p2.showPageNumber = function(num) {
      var txt = new createjs.Text("" + num, "normal 20px Arial", "#000");
      txt.set({
        x: 0,
        y: 0
      });
      return this.addChild(txt);
    };

    // @private
    p2._makeGradient = function(w, h) {
      var cnt = new createjs.Container;
      var g1 = new createjs.Graphics();
      g1.beginLinearGradientFill([createjs.Graphics.getRGB(0, 0, 0, 0), createjs.Graphics.getRGB(0, 0, 0, 0.5)], [1, 0], 0, 0, w, 0).drawRect(0, 0, w, h);
      var s1 = new createjs.Shape(g1);
      var g2 = new createjs.Graphics();
      g2.beginLinearGradientFill([createjs.Graphics.getRGB(0, 0, 0, 0), createjs.Graphics.getRGB(0, 0, 0, .7)], [1, 0], 0, 0, 3, 0).drawRect(0, 0, 10, h);
      var s2 = new createjs.Shape(g2);
      cnt.addChild(s1, s2);
      cnt.cache(0, 0, w, h);
      return cnt.cacheCanvas;
    };

    return createjs.promote(Page, "Container");

  })();

}());




