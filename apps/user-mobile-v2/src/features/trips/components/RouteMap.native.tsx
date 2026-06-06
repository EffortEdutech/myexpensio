/**
 * Native RouteMap — Leaflet via react-native-webview with inline HTML.
 * Fully interactive: tap to set origin/destination pins, drag markers,
 * tap routes to select. OpenStreetMap tiles, no API key.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import WebView from "react-native-webview";

import { colors, spacing, typography } from "@/theme/tokens";

export type LatLng = [number, number];

export type RouteGeometry = {
  coordinates: [number, number][];
  type: "LineString";
};

export type RouteMapRoute = {
  distanceM: number;
  durationS: number;
  geometry: RouteGeometry;
  id: string;
  summary: string;
};

type RouteMapProps = {
  destinationLatLng: LatLng | null;
  mode: "pinning" | "routing";
  onDestinationSet: (latLng: LatLng) => void;
  onOriginSet: (latLng: LatLng) => void;
  onRouteClick: (index: number) => void;
  originLatLng: LatLng | null;
  routes: RouteMapRoute[];
  selectedIndex: number | null;
};

// ── Self-contained Leaflet HTML ───────────────────────────────────────────────
const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body,#map{width:100%;height:100%;background:#f1f5f9}
  .leaflet-control-zoom{margin:8px}
</style>
</head>
<body>
<div id="map"></div>
<script>
var map=L.map('map',{zoomControl:true}).setView([4.2105,101.9758],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© <a href="https://www.openstreetmap.org/copyright">OSM</a>',maxZoom:19
}).addTo(map);

var originMarker=null,destMarker=null,polylines=[],currentMode='pinning';

function icon(color){
  return L.divIcon({className:'',
    html:'<div style="background:'+color+';border:3px solid #fff;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,.3);width:22px;height:22px;"></div>',
    iconSize:[22,22],iconAnchor:[11,11]});
}
function post(msg){window.ReactNativeWebView.postMessage(JSON.stringify(msg));}

map.on('click',function(e){
  if(currentMode!=='pinning')return;
  if(!originMarker)post({type:'originSet',lat:e.latlng.lat,lng:e.latlng.lng});
  else if(!destMarker)post({type:'destinationSet',lat:e.latlng.lat,lng:e.latlng.lng});
});

document.addEventListener('message',onMsg);
window.addEventListener('message',onMsg);

function onMsg(e){var d;try{d=JSON.parse(e.data);}catch(err){return;}if(d.cmd==='update')apply(d);}

function apply(s){
  currentMode=s.mode||'pinning';

  if(s.origin){
    var ll=[s.origin[0],s.origin[1]];
    if(originMarker)originMarker.setLatLng(ll);
    else{
      originMarker=L.marker(ll,{icon:icon('#16a34a'),draggable:true,title:'Origin'}).addTo(map);
      originMarker.on('dragend',function(ev){var p=ev.target.getLatLng();post({type:'originSet',lat:p.lat,lng:p.lng});});
    }
    if(!s.destination)map.setView(ll,14,{animate:true});
  }else if(originMarker){originMarker.remove();originMarker=null;}

  if(s.destination){
    var dll=[s.destination[0],s.destination[1]];
    if(destMarker)destMarker.setLatLng(dll);
    else{
      destMarker=L.marker(dll,{icon:icon('#dc2626'),draggable:true,title:'Destination'}).addTo(map);
      destMarker.on('dragend',function(ev){var p=ev.target.getLatLng();post({type:'destinationSet',lat:p.lat,lng:p.lng});});
    }
    if(s.origin)map.fitBounds([[s.origin[0],s.origin[1]],dll],{animate:true,maxZoom:15,padding:[60,60]});
    else map.setView(dll,14,{animate:true});
  }else if(destMarker){destMarker.remove();destMarker=null;}

  polylines.forEach(function(pl){pl.remove();});polylines=[];
  var SEL=['#2563eb','#d97706','#16a34a'],DIM=['#93c5fd','#fcd34d','#86efac'],bounds=[];
  (s.routes||[]).forEach(function(r,i){
    var sel=i===s.selectedIndex;
    var lls=(r.geometry.coordinates||[]).map(function(c){return[c[1],c[0]];});
    var pl=L.polyline(lls,{color:sel?SEL[i%3]:DIM[i%3],weight:sel?7:3,opacity:sel?0.95:0.45}).addTo(map);
    pl.bindTooltip(r.summary+' · '+(r.distanceM/1000).toFixed(2)+' km',{direction:'top',sticky:true});
    (function(idx){pl.on('click',function(){post({type:'routeClick',index:idx});});})(i);
    polylines.push(pl);lls.forEach(function(p){bounds.push(p);});
  });
  if(bounds.length>0)map.fitBounds(bounds,{animate:true,maxZoom:14,padding:[50,50]});
}
</script>
</body>
</html>`;

export function RouteMap({
  destinationLatLng,
  mode,
  onDestinationSet,
  onOriginSet,
  onRouteClick,
  originLatLng,
  routes,
  selectedIndex,
}: RouteMapProps) {
  const webViewRef = useRef<WebView>(null);
  const [ready, setReady] = useState(false);

  const pushState = useCallback(() => {
    if (!webViewRef.current || !ready) return;
    const state = {
      cmd: "update",
      mode,
      origin: originLatLng,
      destination: destinationLatLng,
      routes,
      selectedIndex: selectedIndex ?? -1,
    };
    const script = `(function(){var e=new MessageEvent('message',{data:${JSON.stringify(JSON.stringify(state))}});window.dispatchEvent(e);})();true;`;
    webViewRef.current.injectJavaScript(script);
  }, [mode, originLatLng, destinationLatLng, routes, selectedIndex, ready]);

  useEffect(() => {
    if (ready) {
      const t = setTimeout(pushState, 300);
      return () => clearTimeout(t);
    }
  }, [ready, pushState]);

  const handleMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const msg = JSON.parse(event.nativeEvent.data) as {
        type: string; lat?: number; lng?: number; index?: number;
      };
      if (msg.type === "originSet" && msg.lat != null && msg.lng != null) {
        onOriginSet([msg.lat, msg.lng]);
      } else if (msg.type === "destinationSet" && msg.lat != null && msg.lng != null) {
        onDestinationSet([msg.lat, msg.lng]);
      } else if (msg.type === "routeClick" && msg.index != null) {
        onRouteClick(msg.index);
      }
    } catch { /* ignore */ }
  }, [onOriginSet, onDestinationSet, onRouteClick]);

  const instruction = !originLatLng
    ? "Tap map to set origin (green pin)"
    : !destinationLatLng
      ? "Tap map to set destination (red pin)"
      : "Drag pins to adjust";

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        style={styles.webview}
        onMessage={handleMessage}
        onLoad={() => setReady(true)}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={["*"]}
        mixedContentMode="always"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        nestedScrollEnabled
      />
      {mode === "pinning" ? (
        <View style={styles.hint} pointerEvents="none">
          <Text style={styles.hintText}>{instruction}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderColor: "#e2e8f0",
    borderRadius: 14,
    borderWidth: 1,
    height: 320,
    overflow: "hidden",
    position: "relative",
    width: "100%",
  },
  webview: { flex: 1 },
  hint: {
    backgroundColor: "rgba(15,23,42,0.82)",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    position: "absolute",
    top: 10,
    alignSelf: "center",
  },
  hintText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
});
