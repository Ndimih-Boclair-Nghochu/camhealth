import { type StyleProp, type ViewStyle } from "react-native";
import { WebView } from "react-native-webview";

export type LatLng = { lat: number; lng: number };
export type MapMarker = { lat: number; lng: number; label: string; color?: string };

/** An interactive OpenStreetMap (Leaflet) map in a WebView.
 *  - mode "route": draws turn-by-turn directions from `origin` to `dest` (OSRM).
 *  - mode "markers": plots `markers` (e.g. on-site staff) plus the user. */
export function LeafletMap({
  mode,
  origin,
  dest,
  markers,
  style,
}: {
  mode: "route" | "markers";
  origin?: LatLng | null;
  dest?: LatLng | null;
  markers?: MapMarker[];
  style?: StyleProp<ViewStyle>;
}) {
  const payload = JSON.stringify({
    mode,
    origin: origin || null,
    dest: dest || null,
    markers: markers || [],
  });

  return (
    <WebView
      originWhitelist={["*"]}
      source={{ html: buildHtml(payload) }}
      style={style}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
    />
  );
}

function buildHtml(payload: string) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.css"/>
<style>
  html,body,#map{height:100%;margin:0;padding:0}
  .leaflet-routing-container{max-height:42%;overflow:auto;font-family:-apple-system,system-ui,Roboto,sans-serif;font-size:14px}
  .leaflet-routing-alt h2{font-size:14px}
</style></head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet-routing-machine@3.2.12/dist/leaflet-routing-machine.js"></script>
<script>
  var D = ${payload};
  var NAVY='#173a5e', TEAL='#1d6f6b', BLUE='#2563eb';
  var map = L.map('map', { zoomControl: true });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
  function pin(color){
    return L.divIcon({ className:'', iconSize:[20,20], iconAnchor:[10,20],
      html:'<div style="background:'+color+';width:18px;height:18px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:2px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.45)"></div>' });
  }
  if (D.mode === 'route') {
    var d = D.dest, o = D.origin;
    L.marker([d.lat,d.lng],{icon:pin(TEAL)}).addTo(map).bindPopup(d.label||'Hospital');
    if (o) {
      L.marker([o.lat,o.lng],{icon:pin(BLUE)}).addTo(map).bindPopup('You are here');
      L.Routing.control({
        waypoints:[L.latLng(o.lat,o.lng), L.latLng(d.lat,d.lng)],
        router: L.Routing.osrmv1({ serviceUrl:'https://router.project-osrm.org/route/v1' }),
        lineOptions:{ styles:[{color:TEAL,weight:6,opacity:.9}] },
        show:true, collapsible:true, addWaypoints:false, draggableWaypoints:false,
        fitSelectedRoutes:true, createMarker:function(){ return null; }
      }).addTo(map);
    } else {
      map.setView([d.lat,d.lng], 15);
    }
  } else {
    var pts=[];
    (D.markers||[]).forEach(function(m){
      L.marker([m.lat,m.lng],{icon:pin(m.color||NAVY)}).addTo(map).bindPopup(m.label);
      pts.push([m.lat,m.lng]);
    });
    if (D.origin){ L.marker([D.origin.lat,D.origin.lng],{icon:pin(BLUE)}).addTo(map).bindPopup('You'); pts.push([D.origin.lat,D.origin.lng]); }
    if (pts.length > 1) map.fitBounds(pts,{padding:[50,50],maxZoom:17});
    else if (pts.length === 1) map.setView(pts[0], 16);
    else map.setView([5.9631,10.1591], 14);
  }
</script></body></html>`;
}
