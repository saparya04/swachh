import React, { useState, useMemo, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Dimensions, StyleSheet,
} from 'react-native';
import { MapContainer, TileLayer, CircleMarker, Polygon, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapTap({ onTap }) {
  useMapEvents({
    click(e) {
      onTap([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

/**
 * Web: Leaflet map — tap to add vertices (min 3). Ring closed for API: [[[lng,lat],...]].
 */
export default function LeafletPolygonPicker({ visible, onClose, onConfirm, mapCenter }) {
  const [markers, setMarkers] = useState([]);
  const center = mapCenter && mapCenter.length === 2 ? mapCenter : [19.076, 72.8777];
  const h = Math.min(Dimensions.get('window').height * 0.62, 520);

  useEffect(() => {
    if (!visible) setMarkers([]);
  }, [visible]);

  const coordsForApi = useMemo(() => {
    if (markers.length < 3) return null;
    const closed = [...markers, markers[0]];
    return [closed.map(([lat, lng]) => [lng, lat])];
  }, [markers]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.wrap}>
        <Text style={styles.title}>Draw cleanup area on map</Text>
        <Text style={styles.hint}>Tap to add corners (at least 3). Use Clear to restart.</Text>
        <View style={[styles.mapBox, { height: h }]}>
          <MapContainer center={center} zoom={15} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapTap onTap={pt => setMarkers(m => [...m, pt])} />
            {markers.map((p, i) => (
              <CircleMarker
                key={i}
                center={p}
                radius={7}
                pathOptions={{ color: '#fff', weight: 2, fillColor: '#1B5E20', fillOpacity: 1 }}
              />
            ))}
            {markers.length >= 3 && (
              <Polygon
                positions={[...markers, markers[0]]}
                pathOptions={{ color: '#00ACC1', weight: 2, fillColor: '#00ACC1', fillOpacity: 0.25 }}
              />
            )}
          </MapContainer>
        </View>
        <View style={styles.row}>
          <TouchableOpacity style={styles.btnGhost} onPress={() => setMarkers([])}>
            <Text style={styles.btnGhostText}>Clear</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnGhost} onPress={onClose}>
            <Text style={styles.btnGhostText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btnPrimary, !coordsForApi && styles.btnDisabled]}
            disabled={!coordsForApi}
            onPress={() => {
              if (coordsForApi) onConfirm(coordsForApi);
            }}>
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
  mapBox: { width: '100%', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#D8EAD8' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16, justifyContent: 'center', paddingBottom: 24 },
  btnGhost: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#D8EAD8' },
  btnGhostText: { fontWeight: '700', color: '#4A6741' },
  btnPrimary: { paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12, backgroundColor: '#1B5E20' },
  btnPrimaryText: { fontWeight: '800', color: '#fff' },
  btnDisabled: { opacity: 0.45 },
});
