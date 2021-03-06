Leaflet.heat
==========

A fork of [Leaflet.heat](http://leaflet.github.io/Leaflet.heat/demo) that allows for an additional field for positive and negative values, for e.g. a sentiment heatmap

## Basic Usage

```js
var heat = L.heatLayer([
	[50.5, 30.5, 0.2, 1], // lat, lng, intensity, layer (1 for positive, 0 for neutral, -1 for negative)
	[50.6, 30.4, 0.5, 0],
	[50.7, 30.3, 0.3, -1],
	...
], {radius: 25}).addTo(map);
```

To include the plugin, just use `leaflet-heat.js` from the `dist` folder:

```html
<script src="leaflet-heat.js"></script>
```

## Building
To build the dist files run:
```npm install && npm run prepublish```


## Reference

#### L.heatLayer(latlngs, options)

Constructs a heatmap layer given an array of points and an object with the following options:
- **minOpacity** - the minimum opacity the heat will start at
- **maxZoom** - zoom level where the points reach maximum intensity (as intensity scales with zoom),
  equals `maxZoom` of the map by default
- **max** - maximum point intensity, `1.0` by default
- **radius** - radius of each "point" of the heatmap, `25` by default
- **blur** - amount of blur, `15` by default
- **gradient** - color gradient config, e.g. `{0.4: 'blue', 0.65: 'lime', 1: 'red'}`
- **autoMax** - automatically compute the max value based on the current map frame

Each point in the input array can be either an array like `[50.5, 30.5, 0.5]`,
or a [Leaflet LatLng object](http://leafletjs.com/reference.html#latlng).

Optional third argument in each `LatLng` point (`altitude`) represents point intensity.
Unless `max` option is specified, intensity should range between `0.0` and `1.0`.


#### Methods

- **setOptions(options)**: Sets new heatmap options and redraws it.
- **addLatLng(latlng)**: Adds a new point to the heatmap and redraws it.
- **setLatLngs(latlngs)**: Resets heatmap data and redraws it.
- **redraw()**: Redraws the heatmap.

## Changelog

#### 0.1.1 &mdash; April 18, 2017

- Initial release.