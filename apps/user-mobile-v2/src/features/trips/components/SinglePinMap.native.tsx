/**
 * SinglePinMap (native) — Leaflet via react-native-webview.
 * Shows a single draggable pin. Tap anywhere to move it.
 * Pre-centers on `center` when provided. Reports every pin
 * position change via `onPinSet`.
 */
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import WebView, { type WebViewMessageEvent } from "react-native-webview";

export type LatLng = [number, number];

type SinglePinMapProps = {
  center: LatLng | null;
  onPinSet: (latLng: LatLng) => void;
  pinLatLng: LatLng | null;
};

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
  .pin-label{
    background:#1d4ed8;color:#fff;font-size:11px;font-weight:700;
    border-radius:4px;padding:2px 6px;white-space:nowrap;
    border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.25);
  }
</style>
</head>
<body>
<div id="map"></div>
<script>
var map = L.map('map',{zoomControl:true}).setView([4.2105,101.9758],6);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{
  attribution:'© OSM contributors',maxZoom:19
}).addTo(map);

var pin = null;

function pinIcon(){
  return L.divIcon({
    className:'',
    html:'<div style="background:#1d4ed8;border:3px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,.35);width:24px;height:24px;cursor:pointer;"></div>',
    iconSize:[24,24],iconAnchor:[12,12]
  });
}

function post(lat,lng){
  window.ReactNativeWebView.postMessage(JSON.stringify({lat:lat,lng:lng}));
}

function setPin(lat,lng){
  if(pin){
    pin.setLatLng([lat,lng]);
  } else {
    pin = L.marker([lat,lng],{icon:pinIcon(),draggable:true}).addTo(map);
    pin.on('dragend',function(e){
      var ll=e.target.getLatLng();
      post(ll.lat,ll.lng);
    });
  }
  post(lat,lng);
}

map.on('click',function(e){
  setPin(e.latlng.lat,e.latlng.lng);
});

document.addEventListener('message',onMsg);
window.addEventListener('message',onMsg);

function onMsg(e){
  var d;try{d=JSON.parse(e.data);}catch(err){return;}
  if(d.cmd==='center'){
    map.setView([d.lat,d.lng],d.zoom||15);
  }
  if(d.cmd==='setPin'){
    setPin(d.lat,d.lng);
    map.setView([d.lat,d.lng],d.zoom||15);
  }
}
</script>
</body>
</html>`;

export function SinglePinMap({ center, onPinSet, pinLatLng }: SinglePinMapProps) {
  const webViewRef = useRef<WebView>(null);
  const initializedRef = useRef(false);

  // When center changes (new geocode result), fly the map there and plant pin
  useEffect(() => {
    if (!center) return;
    const cmd = JSON.stringify({
      cmd: "setPin",
      lat: center[0],
      lng: center[1],
      zoom: 16
    });
    webViewRef.current?.injectJavaScript(`
      try { onMsg({data: '${cmd}'}); } catch(e){}; true;
    `);
  }, [center?.[0], center?.[1]]);

  // Restore existing pin on re-mount
  useEffect(() => {
    if (!initializedRef.current) return;
    if (!pinLatLng) return;
    const cmd = JSON.stringify({
      cmd: "setPin",
      lat: pinLatLng[0],
      lng: pinLatLng[1],
      zoom: 16
    });
    webViewRef.current?.injectJavaScript(`
      try { onMsg({data: '${cmd}'}); } catch(e){}; true;
    `);
  }, [initializedRef.current]);

  function handleMessage(event: WebViewMessageEvent) {
    try {
      const data = JSON.parse(event.nativeEvent.data) as { lat: number; lng: number };
      onPinSet([data.lat, data.lng]);
    } catch {
      // ignore
    }
  }

  function handleLoad() {
    initializedRef.current = true;
    // If we already have a center, plant pin immediately after load
    const target = center ?? pinLatLng;
    if (!target) return;
    const cmd = JSON.stringify({
      cmd: "setPin",
      lat: target[0],
      lng: target[1],
      zoom: 16
    });
    webViewRef.current?.injectJavaScript(`
      try { onMsg({data: '${cmd}'}); } catch(e){}; true;
    `);
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html: MAP_HTML }}
        style={styles.map}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onLoad={handleLoad}
        scrollEnabled={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    height: 220,
    overflow: "hidden",
    width: "100%"
  },
  map: {
    flex: 1
  }
});
