"use strict";function simpleheat(t){if(!(this instanceof simpleheat))return new simpleheat(t);this._canvas=t="string"==typeof t?document.getElementById(t):t,this._ctx=t.getContext("2d"),this._width=t.width,this._height=t.height,this._sorted=!1,this._options=simpleheat.defaultOptions,this._data=[]}function gray(t){return"rgb("+t+", "+t+", "+t+")"}"undefined"!=typeof module&&(module.exports=simpleheat),simpleheat.prototype={data:function(t){return this._data=t,this._sorted=!1,this},add:function(t){return this._data.push(t),this._sorted=!1,this},clear:function(){return this._data=[],this},setOptions:function(t){return this._options=Object.assign({},this._options,t),delete this._circles,delete this._grad,this},getOptions:function(){return Object.assign({},this._options)},resize:function(){this._width=this._canvas.width,this._height=this._canvas.height},_initializeCircleBrush:function(){var t=this._r=this._options.radius+this._options.blur,i=this._circle=this._createCanvas(),a=i.getContext("2d");i.width=i.height=2*t,a.shadowOffsetX=a.shadowOffsetY=2*t,a.fillStyle="black",a.shadowColor="black",a.shadowBlur=this._options.blur,a.beginPath(),a.arc(-t,-t,this._options.radius,0,2*Math.PI,!0),a.closePath(),a.fill()},_initializeGradient:function(){var t=this._createCanvas(),i=t.getContext("2d"),a=i.createLinearGradient(0,0,0,256);t.width=1,t.height=256;for(var s in this._options.gradient)a.addColorStop(+s,this._options.gradient[s]);return i.fillStyle=a,i.fillRect(0,0,1,256),this._grad=i.getImageData(0,0,1,256).data,this},_reinitializeShadowCanvases:function(){this._positiveCanvas||(this._positiveCanvas=this._createCanvas()),this._negativeCanvas||(this._negativeCanvas=this._createCanvas()),this._positiveCtx||(this._positiveCtx=this._positiveCanvas.getContext("2d")),this._negativeCtx||(this._negativeCtx=this._negativeCanvas.getContext("2d")),this._positiveCanvas.width=this._width,this._negativeCanvas.width=this._width,this._positiveCanvas.height=this._height,this._negativeCanvas.height=this._height},_sortData:function(){function t(t){return t[3]+t[0]/i._height/4+t[1]/i._width/4}var i=this;this._data.sort(function(i,a){return t(i)-t(a)}),this._sorted=!0},_clearCanvas:function(t){t.clearRect(0,0,this._width,this._height)},_clearCanvases:function(){this._clearCanvas(this._positiveCtx),this._clearCanvas(this._negativeCtx),this._clearCanvas(this._ctx)},draw:function(t){this._circle||this._initializeCircleBrush(),this._grad||this._initializeGradient(),this._sorted||this._sortData(),this._reinitializeShadowCanvases(),this._clearCanvases();for(var i,a=0,s=this._data.length;a<s;a++){i=this._data[a];var e=0===i[3]?.5:1,n=Math.max(i[2]*e/this._options.max,void 0===t?.05:t);i[3]>=0&&(this._positiveCtx.globalAlpha=n,this._positiveCtx.drawImage(this._circle,i[0]-this._r,i[1]-this._r)),i[3]<=0&&(this._negativeCtx.globalAlpha=n,this._negativeCtx.drawImage(this._circle,i[0]-this._r,i[1]-this._r))}var h=this._positiveCtx.getImageData(0,0,this._width,this._height),o=this._negativeCtx.getImageData(0,0,this._width,this._height);return this._applyNegativeToPositive(h.data,o.data),this._colorize(h.data,this._grad),this._ctx.putImageData(h,0,0),this},_applyNegativeToPositive:function(t,i){for(var a=t,s=0,e=a.length;s<e;s+=4){var n=t[s+3],h=i[s+3],o=255-t[s],r=i[s];if(n&&h){var _=n/255,l=h/255,d=_+(1-_)*l,c=Math.round(255*d),g=_+l,p=_/g,v=Math.round(255*p);a[s]=v,a[s+1]=v,a[s+2]=v,a[s+3]=c}else n?(a[s]=o,a[s+1]=o,a[s+2]=o,a[s+3]=n):h&&(a[s]=r,a[s+1]=r,a[s+2]=r,a[s+3]=h)}},_colorize:function(t,i){if(this._options.colorize)for(var a,s=0,e=t.length;s<e;s+=4){var n=t[s+3];n&&(a=4*t[s],t[s]=i[a],t[s+1]=i[a+1],t[s+2]=i[a+2],t[s+3]=Math.floor(i[a+3]/256*(n/256)*256))}},_createCanvas:function(){return"undefined"!=typeof document?document.createElement("canvas"):new this._canvas.constructor}},simpleheat.defaultOptions={max:1,radius:25,blur:25,gradient:{"0.0":"rgba(204, 0, 0, 1)",.33:"rgba(255, 178, 0, 1)",.5:"rgba(255, 255, 0, 1)",.66:"rgba(180, 255, 0, 1)","1.0":"rgba(0, 214, 96, 1)"},colorize:!0},L.HeatLayer=(L.Layer?L.Layer:L.Class).extend({initialize:function(t,i){this._latlngs=t,L.setOptions(this,Object.assign({},simpleheat.defaultOptions,i))},setLatLngs:function(t){return this._latlngs=t,this.redraw()},addLatLng:function(t){return this._latlngs.push(t),this.redraw()},setOptions:function(t){return L.setOptions(this,t),this._heat&&this._updateOptions(),this.redraw()},redraw:function(){return this._heat&&!this._frame&&this._map&&!this._map._animating&&(this._frame=L.Util.requestAnimFrame(this._redraw,this)),this},onAdd:function(t){this._map=t,this._canvas||this._initCanvas(),this.options.pane?this.getPane().appendChild(this._canvas):t._panes.overlayPane.appendChild(this._canvas),t.on("moveend",this._reset,this),t.options.zoomAnimation&&L.Browser.any3d&&t.on("zoomanim",this._animateZoom,this),this._reset()},onRemove:function(t){this.options.pane?this.getPane().removeChild(this._canvas):t.getPanes().overlayPane.removeChild(this._canvas),t.off("moveend",this._reset,this),t.options.zoomAnimation&&t.off("zoomanim",this._animateZoom,this)},addTo:function(t){return t.addLayer(this),this},_initCanvas:function(){var t=this._canvas=L.DomUtil.create("canvas","leaflet-heatmap-layer leaflet-layer"),i=L.DomUtil.testProp(["transformOrigin","WebkitTransformOrigin","msTransformOrigin"]);t.style[i]="50% 50%";var a=this._map.getSize();t.width=a.x,t.height=a.y;var s=this._map.options.zoomAnimation&&L.Browser.any3d;L.DomUtil.addClass(t,"leaflet-zoom-"+(s?"animated":"hide")),this._heat=simpleheat(t),this._updateOptions(),this.redraw()},_updateOptions:function(){this._heat.setOptions(this.options)},_reset:function(){var t=this._map.containerPointToLayerPoint([0,0]);L.DomUtil.setPosition(this._canvas,t);var i=this._map.getSize();this._heat._width!==i.x&&(this._canvas.width=this._heat._width=i.x),this._heat._height!==i.y&&(this._canvas.height=this._heat._height=i.y),this._redraw()},_redraw:function(){if(this._map){var t,i,a,s,e,n,h,o,r,_,l=[],d=this._heat._r,c=this._map.getSize(),g=new L.Bounds(L.point([-d,-d]),c.add([d,d])),p=void 0===this.options.max?1:this.options.max,v=void 0===this.options.maxZoom?this._map.getMaxZoom():this.options.maxZoom,m=1/Math.pow(2,Math.max(0,Math.min(v-this._map.getZoom(),12))),u=d/2,f=[],C=this._map._getMapPanePos(),w=C.x%u,x=C.y%u;for(t=0,i=this._latlngs.length;t<i;t++){var y=this._latlngs[t];if(a=this._map.latLngToContainerPoint(y.slice?y.slice(0,2):y),g.contains(a)){e=Math.floor((a.x-w)/u)+2,n=Math.floor((a.y-x)/u)+2;var O=void 0!==this._latlngs[t].alt?this._latlngs[t].alt:void 0!==this._latlngs[t][2]?+this._latlngs[t][2]:1;_=(void 0===this._latlngs[t][3]?1:this._latlngs[t][3])+1,r=O*m,f[n]=f[n]||[],f[n][e]=f[n][e]||[],s=f[n][e][_],s?(s[0]=(s[0]*s[2]+a.x*r)/(s[2]+r),s[1]=(s[1]*s[2]+a.y*r)/(s[2]+r),s[2]+=r):f[n][e][_]=[a.x,a.y,r,_]}}for(var t=0,i=f.length;t<i;t++)if(f[t])for(var h=0,o=f[t].length;h<o;h++)if(f[t][h])for(var r=0,z=f[t][h].length;r<z;r++)(s=f[t][h][r])&&l.push([Math.round(s[0]),Math.round(s[1]),Math.min(s[2],p),s[3]-1]);this._heat.data(l).draw(this.options.minOpacity),this._frame=null}},_animateZoom:function(t){var i=this._map.getZoomScale(t.zoom),a=this._map._getCenterOffset(t.center)._multiplyBy(-i).subtract(this._map._getMapPanePos());L.DomUtil.setTransform?L.DomUtil.setTransform(this._canvas,a,i):this._canvas.style[L.DomUtil.TRANSFORM]=L.DomUtil.getTranslateString(a)+" scale("+i+")"}}),L.heatLayer=function(t,i){return new L.HeatLayer(t,i)};
//# sourceMappingURL=dist/leaflet-heat.js.map