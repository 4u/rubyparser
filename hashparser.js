
var HashParser = (function() {

  var HashParser = function(rawData, options) {
    this._options = {
      showArrayItemNumber: false,
      hasToggle: false,
      hasPanel: false,
      hasRaw: false
    };

    for (var name in options) {
      if (options.hasOwnProperty(name)) {
        this._options[name] = options[name];
      }
    };

    this.parse(rawData);
  };


  HashParser.escape = function(str, noBr) {
    if (str == null) {
      return str;
    }

    if (!noBr) {
      str = (str+'').replace(/\n/g, '<br>');
    }

    str = (str+'').replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    return str;
  };

  HashParser.prototype.parse = function(rawData) {
    this._rawData = [];
    this._data = [];
    this._chunks = rawData.split("\n");
    for (var i = 0, l = this._chunks.length; i < l; i++) {
      var data = this._parseChunk(this._chunks[i]);
      if (data) {
        this._data.push(data);
      }
      this._rawData.push(this._chunks[i]);
    }
  };

  HashParser.prototype._parseChunk = function(rawData) {
    rawData = rawData.replace(/(({|,)\s*".+?"\s*)(\=\>)/g, "$1:");
    // TODO(max@rururu.me): fuckin JSON.parse won't parse my string!
    // return jQuery.parseJSON(rawData);
    return eval(rawData);
  };

  HashParser.prototype.get = function() {
    return this._data;
  };

  HashParser.prototype.getDocumentFragment = function() {
    var panelHtml = this._options.hasPanel && (this._options.hasToggle || this._options.hasRaw) ?
      '<div class="hashparser-panel">' +
        (this._options.hasRaw ?
          '<span class="hashparser-panel-item hashparser-panel-raw">RAW</span>' +
          '<span class="hashparser-panel-separator"></span>'
        : '') +
        (this._options.hasToggle ?
          '<span class="hashparser-panel-item hashparser-panel-minus hashparser-panel-lvl-all">- all</span>' +
          '<span class="hashparser-panel-item hashparser-panel-minus hashparser-panel-lvl-1">- 1</span>' +
          '<span class="hashparser-panel-item hashparser-panel-minus hashparser-panel-lvl-2">- 2</span>' +
          '<span class="hashparser-panel-item hashparser-panel-minus hashparser-panel-lvl-3">- 3</span>' +
          '<span class="hashparser-panel-separator"></span>' +
          '<span class="hashparser-panel-item hashparser-panel-plus hashparser-panel-lvl-all">+ all</span>' +
          '<span class="hashparser-panel-item hashparser-panel-plus hashparser-panel-lvl-1">+ 1</span>' +
          '<span class="hashparser-panel-item hashparser-panel-plus hashparser-panel-lvl-2">+ 2</span>' +
          '<span class="hashparser-panel-item hashparser-panel-plus hashparser-panel-lvl-3">+ 3</span>'
         : '') +
      '</div>' : '';

    this._element = $(
      '<div class="hashparser">' +
        panelHtml +
        '<div class="hashparser-json">' +
          this._stringify(this._data) +
        '</div>' +
        (this._options.hasRaw ?
          '<div class="hashparser-raw">' +
            HashParser.escape(this._rawData.join("\n"), true) +
          '</div>'
        : '') +
      '</div>'
    );
    $('.hashparser-panel-item', this._element).bind('click', $.proxy(function(evt) {
      var item = $(evt.target);
      if (item.hasClass('hashparser-panel-raw')) {
        this._element.toggleClass('hashparser-mode-raw');
        return;
      }
      var selector = '';
      var isMinus = item.hasClass('hashparser-panel-minus');
      if (item.hasClass('hashparser-panel-lvl-all')) {
        selector = '.hashparser-toggle';
      } else if (item.hasClass('hashparser-panel-lvl-1')) {
        selector = '.hashparser-toggleable-item .hashparser-toggle';
      } else if (item.hasClass('hashparser-panel-lvl-2')) {
        selector = '.hashparser-toggleable-item .hashparser-toggleable-item .hashparser-toggle';
      } else if (item.hasClass('hashparser-panel-lvl-3')) {
        selector = '.hashparser-toggleable-item .hashparser-toggleable-item .hashparser-toggleable-item .hashparser-toggle';
      }

      $(selector, this._element).each(function() {
        var toggleable = $(this).next().next();
        toggleable.toggleClass("hashparser-toggle-hidden", isMinus);
        $(this)
          .toggleClass('hashparser-toggle-plus', isMinus)
          .html(isMinus ? '+' : '-');
      });
    }, this));
    $('.hashparser-toggle', this._element).bind('click', function(evt) {
      var toggleable = $(this).next().next();
      toggleable.toggleClass("hashparser-toggle-hidden");
      var isHidden = toggleable.hasClass('hashparser-toggle-hidden');
      $(this)
        .toggleClass('hashparser-toggle-plus', isHidden)
        .html(isHidden ? '+' : '-');
    });

    return this._element;
  };

  HashParser.prototype._isPrimitive = function(val) {
    switch (typeof val) {
      case "number":
      case "string":
      case "boolean":
      case "null":
      case "undefined":
        return true;
    }

    return false;
  };

  HashParser.prototype._stringify = function(val) {
    var ret = '';
    if (this._isPrimitive(val)) {
      ret += this._formatPrimitive(val);
    } else {
      if (val instanceof Array) {
        ret += this._formatArray(val);
      } else {
        ret += this._formatObject(val);
      }
    }
    return ret;
  };

  HashParser.prototype._formatPrimitive = function(val) {
    switch (typeof val) {
      case "number":
        return '<span class="hashparser-primitive hashparser-type-number">' + HashParser.escape(val) + '</span>';
      case "string":
        if ((/^https?:\/\//).test(val)) {
          return '<span class="hashparser-primitive hashparser-type-string">"<a href="' + val + '" target="_blank">' + HashParser.escape(val) + '</a>"</span>';
        }
        return '<span class="hashparser-primitive hashparser-type-string">"' + HashParser.escape(val) + '"</span>';
      case "boolean":
        return '<span class="hashparser-primitive hashparser-type-boolean">' + (val ? 'true' : 'false') + '</span>';
      case "null":
        return '<span class="hashparser-primitive hashparser-type-null">null</span>';
      case "undefined":
        return '<span class="hashparser-primitive hashparser-type-undefined">undefined</span>';
      default:
        return val;
    }
  };

  HashParser.prototype._formatArray = function(val) {
    var ret = '';
    if (this._options.hasToggle && val.length > 0) {
      ret += '<span class="hashparser-toggle">-</span>';
    }
    ret += '<span class="hashparser-type-array-before">[</span>';
    ret += '<span class="hashparser-toggleable">';
    for (var i = 0, l = val.length; i < l; i++) {
      ret += '<div class="hashparser-toggleable-item hashparser-type-array-item">';
      if (this._options.showArrayItemNumber) {
        ret += '<span class="hashparser-type-array-item-number">' + i + '</span>';
      }
      ret += this._stringify(val[i]);
      if (i < l - 1) {
        ret += '<span class="hashparser-comma">,</span>';
      }
      ret += '</div>';
    }
    ret += '</span>';
    ret += '<span class="hashparser-type-array-after">]</span>';
    return ret;
  };

  HashParser.prototype._formatObject = function(val) {
    var i = 0;
    var l = 0;
    for (var name in val) {
      if (!val.hasOwnProperty(name)) {
        continue;
      }
      l++;
    };

    var ret = '';
    if (this._options.hasToggle && l > 0) {
      ret += '<span class="hashparser-toggle">-</span>';
    }
    ret += '<span class="hashparser-type-object-before">{</span>';

    ret += '<span class="hashparser-toggleable">';
    for (name in val) {
      if (!val.hasOwnProperty(name)) {
        continue;
      }
      ret += '<div class="hashparser-toggleable-item hashparser-type-object-item">';
      ret += '<span class="hashparser-type-object-item-name">';
      ret += '"' + name + '": ';
      ret += '</span>';
      ret += '<span class="hashparser-type-object-item-value">';
      ret += this._stringify(val[name]);
      ret += '</span>';
      if (i < l - 1) {
        ret += '<span class="hashparser-comma">,</span>';
      }
      ret += '</div>';
      i++;
    }
    ret += '</span>';
    ret += '<span class="hashparser-type-object-after">}</span>';
    return ret;
  };


  return HashParser;
})();