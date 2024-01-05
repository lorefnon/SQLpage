/* !include https://cdn.jsdelivr.net/npm/@tabler/core@1.0.0-beta20/dist/js/tabler.min.js */
/* !include https://cdn.jsdelivr.net/npm/list.js-fixed@2.3.4/dist/list.min.js */

function sqlpage_chart() {
  let first_chart = document.querySelector("[data-pre-init=chart]");
  if (first_chart) {
    // Add the apexcharts js to the page
    const apexcharts_js = document.createElement("script");
    apexcharts_js.src = first_chart.dataset.js;
    document.head.appendChild(apexcharts_js);
  }
}

function sqlpage_card() {
    for (const c of document.querySelectorAll("[data-pre-init=card]")) {
        const source = c.dataset.embed;
        fetch(c.dataset.embed)
            .then(res => res.text())
            .then(html => {
                const body = c.querySelector(".card-content");
                body.innerHTML = html;
                c.removeAttribute("data-pre-init");
                const spinner = c.querySelector(".card-loading-placeholder");
                if (spinner) {
                    spinner.parentNode.removeChild(spinner);
                }
                const fragLoadedEvt = new CustomEvent("fragment-loaded", {
                    bubbles: true
                });
                c.dispatchEvent(fragLoadedEvt);
            })
    }
}

function sqlpage_table(){
    // Tables
    for (const r of document.querySelectorAll("[data-pre-init=table]")) {
        new List(r, {
            valueNames: [...r.getElementsByTagName("th")].map(t => t.textContent),
            searchDelay: 100,
            indexAsync: true
        });
        r.removeAttribute("data-pre-init");
    }
}

let is_leaflet_injected = false;
let is_leaflet_loaded = false;

function sqlpage_map() {
    const first_map = document.querySelector("[data-pre-init=map]");
    if (first_map && !is_leaflet_injected) {
      // Add the leaflet js and css to the page
      const leaflet_css = document.createElement("link");
      leaflet_css.rel = "stylesheet";
      leaflet_css.href = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css";
      leaflet_css.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=";
      leaflet_css.crossOrigin = "anonymous";
      document.head.appendChild(leaflet_css);
      const leaflet_js = document.createElement("script");
      leaflet_js.src = "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js";
      leaflet_js.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=";
      leaflet_js.crossOrigin = "anonymous";
      leaflet_js.onload = onLeafletLoad;
      document.head.appendChild(leaflet_js);
      is_leaflet_injected = true;
    }
    if (first_map && is_leaflet_loaded) {
      onLeafletLoad();
    }
    function onLeafletLoad() {
      is_leaflet_loaded = true;
      const maps = document.querySelectorAll("[data-pre-init=map]");
      for (const m of maps) {
        const tile_source = m.dataset.tile_source;
        const maxZoom = +m.dataset.max_zoom;
        const attribution = m.dataset.attribution;
        const center = m.dataset.center.split(",").map(c => parseFloat(c));
        const map = L.map(m, { attributionControl: !!attribution });
        map.setView(center, +m.dataset.zoom);
        L.tileLayer(tile_source, { attribution, maxZoom }).addTo(map);
        for (const marker_elem of m.getElementsByClassName("marker")) {
          setTimeout(addMarker, 0, marker_elem, map);
        }
        m.removeAttribute("data-pre-init");
      }
    }
    function addMarker(marker_elem, map) {
      const { dataset } = marker_elem;
      const options = {
        color: marker_elem.dataset.color,
        title: marker_elem.getElementsByTagName("h3")[0].textContent.trim(),
      };
      const marker = 
        dataset.coords ? createMarker(marker_elem, options)
                       : createGeoJSONMarker(marker_elem, options);
      marker.addTo(map);
      if (options.title) marker.bindPopup(marker_elem);
      else if (marker_elem.dataset.link) marker.on('click', () => window.location = marker_elem.dataset.link);
    }
    function createMarker(marker_elem, options) {
      const coords = marker_elem.dataset.coords.split(",").map(c => parseFloat(c));
      const icon_obj = marker_elem.getElementsByClassName("mapicon")[0];
      if (icon_obj) {
        const size = 1.5 * +(options.size || icon_obj.firstChild?.getAttribute('width') || 24);
        options.icon = L.divIcon({
          html: icon_obj,
          className: `border-0 bg-${options.color || 'primary'} bg-gradient text-white rounded-circle shadow d-flex justify-content-center align-items-center`,
          iconSize: [size, size],
          iconAnchor: [size/2, size/2],
        });
      }
      return L.marker(coords, options);
    }
    function createGeoJSONMarker(marker_elem, options) {
      let geojson = JSON.parse(marker_elem.dataset.geojson);
      if (options.color) {
        options.color = get_tabler_color(options.color) || options.color;
      }
      function style({ properties }) {
        if (typeof properties !== "object") return options;
        return {...options, ...properties};
      }
      function pointToLayer(feature, latlng) {
        marker_elem.dataset.coords = latlng.lat + "," + latlng.lng;
        return createMarker(marker_elem, { ...options, ...feature.properties });
      }
      return L.geoJSON(geojson, { style, pointToLayer });
    }
}

function get_tabler_color(name) {
    return getComputedStyle(document.documentElement).getPropertyValue('--tblr-' + name);
}

function init_components() {
    sqlpage_table();
    sqlpage_chart();
    sqlpage_map();
    sqlpage_card();
}

document.addEventListener('DOMContentLoaded', init_components);

document.addEventListener('fragment-loaded', init_components);
