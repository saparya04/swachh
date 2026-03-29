import React, { useRef, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';

const HTML = (lat, lng) => `<!DOCTYPE html>
<html><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1,maximum-scale=1"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<style>html,body,#map{margin:0;padding:0;height:100%;width:100%;}</style>
</head><body>
<div id="map"></div>
<script>
var markers = [];
var layers = [];
var poly = null;
var map = L.map('map').setView([${lat}, ${lng}], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19}).addTo(map);
function redraw() {
  layers.forEach(function(l){ map.removeLayer(l); });
  layers = [];
  markers.forEach(function(p){
    var c = L.circleMarker(p, {radius:7, color:'#fff', weight:2, fillColor:'#1B5E20', fillOpacity:1});
    c.addTo(map);
    layers.push(c);
  });
  if (poly) { map.removeLayer(poly); poly = null; }
  if (markers.length >= 3) {
    poly = L.polygon(markers, {color:'#00ACC1', weight:2, fillOpacity:0.25});
    poly.addTo(map);
  }
}
map.on('click', function(e) {
  markers.push([e.latlng.lat, e.latlng.lng]);
  redraw();
});
function clearAll() {
  markers = [];
  redraw();
}
function sendRing() {
  if (markers.length < 3) return;
  var ring = markers.concat([markers[0]]).map(function(p){ return [p[1], p[0]]; });
  if (window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'polygon', coordinates: [ring] }));
  }
}
</script>
</body></html>`;

export default function LeafletPolygonPicker({ visible, onClose, onConfirm, mapCenter }) {
  const webRef = useRef(null);
  const [ready, setReady] = useState(false);
  const lat = mapCenter && mapCenter[0] != null ? mapCenter[0] : 19.076;
  const lng = mapCenter && mapCenter[1] != null ? mapCenter[1] : 72.8777;
  const h = Math.min(Dimensions.get('window').height * 0.62, 520);

  useEffect(() => {
    if (!visible) setReady(false);
  }, [visible]);

  const clearMap = () => {
    webRef.current?.injectJavaScript('try{clearAll();}catch(e){} true;');
  };
  const confirmMap = () => {
    webRef.current?.injectJavaScript('try{sendRing();}catch(e){} true;');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Draw cleanup area on map</Text>
        <Text style={styles.hint}>Tap map to add corners (at least 3).</Text>
        <WebView
          ref={webRef}
          originWhitelist={['*']}
          source={{ html: HTML(lat, lng) }}
          style={{ height: h, width: '100%', borderRadius: 16 }}
          onLoadEnd={() => setReady(true)}
          onMessage={ev => {
            try {
              const d = JSON.parse(ev.nativeEvent.data);
              if (d.type === 'polygon' && d.coordinates) onConfirm(d.coordinates);
            } catch { /* */ }
          }}
          javaScriptEnabled
          domStorageEnabled
        />
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnGhost} onPress={clearMap}>
            <Text style={styles.btnGhostText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
            <Text style={styles.btnGhostText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, !ready && styles.btnDisabled]}
            disabled={!ready}
            onPress={confirmMap}>
            <Text style={styles.btnPrimaryText}>Use this area</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#F1F8F1', paddingTop: 48, paddingHorizontal: 12 },
  title: { fontSize: 18, fontWeight: '800', color: '#1A2B1A', marginBottom: 6 },
  hint: { fontSize: 13, color: '#7E9C7A', marginBottom: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16, justifyContent: 'center', paddingBottom: 24 },
  btnGhost: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D8EAD8' },
  btnGhostText: { fontWeight: '700', color: '#4A6741' },
  btnPrimary: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#1B5E20' },
  btnPrimaryText: { fontWeight: '800', color: '#fff' },
  btnDisabled: { opacity: 0.45 },
});
