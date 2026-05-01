import React, { useState, useEffect, useRef, createElement } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  Alert, ScrollView, Platform, Image, Dimensions, Animated, Modal, StatusBar
} from 'react-native';
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, initializeAuth, getReactNativePersistence, browserLocalPersistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { WebView } from 'react-native-webview';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import LeafletPolygonPicker from './components/LeafletPolygonPicker';
import io from 'socket.io-client';

const socket = io('http://192.168.1.9:5000', { transports: ['websocket'], autoConnect: true });

const firebaseConfig = {
  apiKey: "AIzaSyCTL_q0pfcj0Ut0_20MnR8GThLi9kc5U-E",
  authDomain: "th-year-e940d.firebaseapp.com",
  projectId: "th-year-e940d",
  storageBucket: "th-year-e940d.firebasestorage.app",
  messagingSenderId: "1056026710715",
  appId: "1:1056026710715:web:fbbdc5b70277c29bed8f9e",
  measurementId: "G-2VPF0FER2N"
};

const BACKEND_URL = 'http://192.168.1.9:5000';
const BASE_URL    = 'http://192.168.1.9:5000/api';
const FLASK_URL   = 'http://192.168.1.9:5001';

const app = initializeApp(firebaseConfig);
const getPersistenceMethod = () =>
  Platform.OS === 'web' ? browserLocalPersistence : getReactNativePersistence(AsyncStorage);
const auth = initializeAuth(app, { persistence: getPersistenceMethod() });

const { width } = Dimensions.get('window');

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  primary: '#1B5E20', primaryLight: '#2E7D32', primaryMid: '#388E3C',
  accent: '#00ACC1', accentLight: '#B2EBF2',
  gold: '#F9A825', goldLight: '#FFF8E1',
  danger: '#C62828', dangerLight: '#FFEBEE',
  bg: '#F1F8F1', card: '#FFFFFF', dark: '#1A2B1A',
  mid: '#4A6741', muted: '#7E9C7A', border: '#D8EAD8', white: '#FFFFFF',
};

const S = StyleSheet.create({
  flex: { flex: 1 },
  fullCenter: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  h1: { fontSize: 28, fontWeight: '700', color: T.dark, letterSpacing: -0.3 },
  h2: { fontSize: 22, fontWeight: '700', color: T.dark },
  h3: { fontSize: 17, fontWeight: '600', color: T.dark },
  body: { fontSize: 14, color: T.mid, lineHeight: 20 },
  caption: { fontSize: 12, color: T.muted },
  label: { fontSize: 11, fontWeight: '700', color: T.muted, letterSpacing: 1.5, textTransform: 'uppercase' },
  btnPrimary: {
    backgroundColor: T.primary, paddingVertical: 16, paddingHorizontal: 24,
    borderRadius: 14, alignItems: 'center',
    shadowColor: T.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  btnAccent: {
    backgroundColor: T.accent, paddingVertical: 16, paddingHorizontal: 24,
    borderRadius: 14, alignItems: 'center',
    shadowColor: T.accent, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  btnDanger: { backgroundColor: T.danger, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
  btnOutline: { borderWidth: 2, borderColor: T.primary, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 14, alignItems: 'center' },
  btnText: { color: T.white, fontWeight: '700', fontSize: 15, letterSpacing: 0.3 },
  btnDisabled: { opacity: 0.5 },
  inputWrap: { marginBottom: 16 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: T.mid, letterSpacing: 0.8, marginBottom: 6, textTransform: 'uppercase' },
  input: { backgroundColor: T.white, borderWidth: 1.5, borderColor: T.border, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: T.dark },
  card: { backgroundColor: T.card, borderRadius: 20, padding: 20, shadowColor: T.dark, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 5, marginBottom: 16 },
  cardGreen: { backgroundColor: T.primary, borderRadius: 20, padding: 20, shadowColor: T.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10, marginBottom: 16 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, backgroundColor: T.accentLight },
  tagText: { fontSize: 11, fontWeight: '700', color: T.accent },
  tabBar: { flexDirection: 'row', backgroundColor: T.white, borderTopWidth: 1, borderTopColor: T.border, paddingBottom: Platform.OS === 'ios' ? 20 : 8, paddingTop: 8, shadowColor: T.dark, shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 12 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: T.primary, marginTop: 3 },
  divider: { height: 1, backgroundColor: T.border, marginVertical: 16 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: T.bg, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: T.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarLg: { width: 72, height: 72, borderRadius: 36, backgroundColor: T.primaryLight, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: T.white, fontWeight: '800', fontSize: 20 },
  avatarTextLg: { color: T.white, fontWeight: '800', fontSize: 28 },
  statBox: { flex: 1, backgroundColor: T.card, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: T.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3, marginHorizontal: 4 },
});

// ── Helper components ─────────────────────────────────────────────────────────

const GreenHeader = ({ title, subtitle, onBack, rightAction, bgColor }) => (
  <View style={{ backgroundColor: bgColor || T.primary, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      {onBack
        ? <TouchableOpacity onPress={onBack} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: T.white, fontSize: 18 }}>←</Text>
          </TouchableOpacity>
        : <View style={{ width: 36 }} />}
      <Text style={{ color: T.white, fontSize: 17, fontWeight: '700' }}>{title}</Text>
      {rightAction || <View style={{ width: 36 }} />}
    </View>
    {subtitle ? <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, textAlign: 'center', marginTop: 4 }}>{subtitle}</Text> : null}
  </View>
);

const StyledInput = ({ label, ...props }) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={S.inputWrap}>
      {label ? <Text style={S.inputLabel}>{label}</Text> : null}
      <TextInput style={[S.input, focused && { borderColor: T.primaryMid }]}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        placeholderTextColor={T.muted} {...props} />
    </View>
  );
};

const TabBar = ({ activeTab, setActiveTab, tabs }) => {
  const cfg = {
    Home: { emoji: '🏠', label: 'Home' }, Events: { emoji: '🗓️', label: 'Events' },
    Classify: { emoji: '📸', label: 'Scan' }, Rewards: { emoji: '🏆', label: 'Rewards' },
    Messages: { emoji: '💬', label: 'Chat' }, Reports: { emoji: '📈', label: 'Reports' },
    Settings: { emoji: '⚙️', label: 'Profile' }, Analytics: { emoji: '📊', label: 'Analytics' },
  };
  return (
    <View style={S.tabBar}>
      {tabs.map(tab => {
        const c = cfg[tab] || { emoji: '•', label: tab };
        const active = activeTab === tab;
        return (
          <TouchableOpacity key={tab} style={S.tabItem} onPress={() => setActiveTab(tab)}>
            <Text style={{ fontSize: 22, opacity: active ? 1 : 0.4 }}>{c.emoji}</Text>
            <Text style={{ fontSize: 10, fontWeight: active ? '700' : '500', color: active ? T.primary : T.muted, marginTop: 2 }}>{c.label}</Text>
            {active && <View style={S.tabDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const StatBox = ({ emoji, value, label }) => (
  <View style={S.statBox}>
    <Text style={{ fontSize: 24, marginBottom: 4 }}>{emoji}</Text>
    <Text style={{ fontSize: 22, fontWeight: '800', color: T.dark }}>{value}</Text>
    <Text style={[S.caption, { textAlign: 'center' }]}>{label}</Text>
  </View>
);

const XPBar = ({ xp = 0, level = 1 }) => {
  const maxXp = level * 500;
  const progress = xp % 500;
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={S.caption}>Level {level} · XP Progress</Text>
        <Text style={{ fontSize: 12, fontWeight: '700', color: T.primary }}>{progress} / 500 XP</Text>
      </View>
      <View style={{ height: 8, backgroundColor: T.border, borderRadius: 4 }}>
        <View style={{ height: '100%', width: `${(progress / 500) * 100}%`, backgroundColor: T.primary, borderRadius: 4 }} />
      </View>
    </View>
  );
};

// ── WELCOME / AUTH ────────────────────────────────────────────────────────────

const WelcomeScreen = ({ setRole, setIsRegistering, setIsLoggedIn }) => {
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();
  }, []);
  const roles = [
    { key: 'volunteer', emoji: '🌿', label: 'Volunteer',   desc: 'Join cleanup drives & earn rewards' },
    { key: 'organiser', emoji: '📋', label: 'Organiser',   desc: 'Create and manage events' },
    { key: 'csr',       emoji: '🏢', label: 'CSR Partner', desc: 'Fund and track your green impact' },
  ];
  return (
    <View style={{ flex: 1, backgroundColor: T.primary }}>
      <StatusBar barStyle="light-content" />
      <View style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(255,255,255,0.06)' }} />
      <View style={{ position: 'absolute', bottom: 100, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,172,193,0.15)' }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 28 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={{ alignItems: 'center', paddingTop: 90, paddingBottom: 50 }}>
            <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginBottom: 24 }}>
              <Text style={{ fontSize: 48 }}>🌱</Text>
            </View>
            <Text style={{ fontSize: 38, fontWeight: '800', color: T.white, letterSpacing: -0.5, textAlign: 'center', lineHeight: 46 }}>Swachh{'\n'}Mitra</Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, marginTop: 10 }}>Clean Together · Impact Forever</Text>
          </View>
          <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center', marginBottom: 18 }}>CONTINUE AS</Text>
          {roles.map(r => (
            <TouchableOpacity key={r.key} onPress={() => { setRole(r.key); setIsRegistering(); }}
              style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 18, padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Text style={{ fontSize: 26 }}>{r.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: T.white, fontSize: 16, fontWeight: '700' }}>{r.label}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 }}>{r.desc}</Text>
              </View>
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22 }}>›</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity onPress={setIsLoggedIn} style={{ marginTop: 24, alignItems: 'center', paddingBottom: 40 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }}>
              Already have an account?{'  '}<Text style={{ color: T.white, fontWeight: '700', textDecorationLine: 'underline' }}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const RegisterScreen = ({ role, setScreen, setRole, setUserData }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const roleEmoji = { volunteer: '🌿', organiser: '📋', csr: '🏢' };
  const roleColor = { volunteer: T.primary, organiser: T.accent, csr: '#4527A0' };

  const handleRegister = async () => {
    setError(null);
    if (!name || !email || !password || !location) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    try {
      const uc  = await createUserWithEmailAndPassword(auth, email, password);
      const res = await axios.post(`${BACKEND_URL}/api/users/register-data`, {
        firebaseUid: uc.user.uid, name, email, role, location,
      });
      setUserData(res.data.user);
      setScreen('dashboard');
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="light-content" />
      <GreenHeader title={`Join as ${role?.toUpperCase()}`} onBack={() => { setScreen('welcome'); setRole(null); }} />
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: 16, padding: 16, marginBottom: 24, shadowColor: T.dark, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, elevation: 3 }}>
          <Text style={{ fontSize: 36, marginRight: 14 }}>{roleEmoji[role] || '👤'}</Text>
          <View>
            <Text style={S.label}>Registering as</Text>
            <Text style={{ fontSize: 20, fontWeight: '800', color: roleColor[role] || T.primary }}>
              {role?.charAt(0).toUpperCase() + role?.slice(1)}
            </Text>
          </View>
        </View>
        {error && (
          <View style={{ backgroundColor: T.dangerLight, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: T.danger }}>
            <Text style={{ color: T.danger, fontWeight: '600', fontSize: 13 }}>⚠️  {error}</Text>
          </View>
        )}
        <StyledInput label="Full Name"       placeholder="Your full name"            value={name}     onChangeText={setName}     autoCapitalize="words" />
        <StyledInput label="Email Address"   placeholder="you@email.com"             value={email}    onChangeText={setEmail}    keyboardType="email-address" autoCapitalize="none" />
        <StyledInput label="Password"        placeholder="Min. 6 characters"         value={password} onChangeText={setPassword} secureTextEntry />
        <StyledInput label="Location / City" placeholder="e.g. Mumbai, Maharashtra"  value={location} onChangeText={setLocation} />
        <TouchableOpacity onPress={handleRegister} disabled={loading} style={[S.btnPrimary, loading && S.btnDisabled, { marginTop: 8 }]}>
          {loading ? <ActivityIndicator color={T.white} /> : <Text style={S.btnText}>Create Account →</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => { setScreen('welcome'); setRole(null); }} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: T.muted, fontSize: 14 }}>← Back to role selection</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const LoginScreen = ({ setScreen, setUserData }) => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);

  const handleLogin = async () => {
    setError(null); setLoading(true);
    try {
      const uc  = await signInWithEmailAndPassword(auth, email, password);
      const res = await axios.get(`${BACKEND_URL}/api/users/role/${uc.user.uid}`);
      setUserData({ ...res.data, firebaseUid: uc.user.uid, email: uc.user.email });
      setScreen('dashboard');
    } catch (err) { setError(err.response?.data?.message || err.message); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <StatusBar barStyle="light-content" />
      <GreenHeader title="Welcome Back" onBack={() => setScreen('welcome')} />
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', marginVertical: 32 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: T.primary, justifyContent: 'center', alignItems: 'center', shadowColor: T.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, elevation: 10 }}>
            <Text style={{ fontSize: 38 }}>🌱</Text>
          </View>
          <Text style={[S.h2, { marginTop: 14 }]}>Log in to SwachhMitra</Text>
          <Text style={[S.body, { marginTop: 4 }]}>Continue your eco-impact journey</Text>
        </View>
        {error && (
          <View style={{ backgroundColor: T.dangerLight, borderRadius: 12, padding: 14, marginBottom: 16, borderLeftWidth: 4, borderLeftColor: T.danger }}>
            <Text style={{ color: T.danger, fontWeight: '600', fontSize: 13 }}>⚠️  {error}</Text>
          </View>
        )}
        <StyledInput label="Email Address" placeholder="you@email.com"  value={email}    onChangeText={setEmail}    keyboardType="email-address" autoCapitalize="none" />
        <StyledInput label="Password"      placeholder="Your password"  value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity onPress={handleLogin} disabled={loading} style={[S.btnPrimary, loading && S.btnDisabled, { marginTop: 8 }]}>
          {loading ? <ActivityIndicator color={T.white} /> : <Text style={S.btnText}>Log In →</Text>}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setScreen('welcome')} style={{ marginTop: 20, alignItems: 'center' }}>
          <Text style={{ color: T.muted, fontSize: 14 }}>← Back to Welcome</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ── CLASSIFY ──────────────────────────────────────────────────────────────────

const ClassifyScreen = ({ userData }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [wasteData, setWasteData] = useState({ name: '', type: '' });
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const cameraRef = useRef(null);
  const catColors = { 'Dry': '#0288D1', 'Wet': '#388E3C', 'Hazardous': '#D32F2F', 'E-Waste': '#7B1FA2' };

  const runDetection = async () => {
    if (!cameraRef.current || !showLiveFeed) return;
    try {
      setScanning(true);
      const photo  = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.3 });
      const res    = await axios.post(`${FLASK_URL}/classify_frame`, { image: photo.base64 });
      setProcessedImage(`data:image/jpeg;base64,${res.data.image}`);
      if (res.data.label) {
        const det = { name: res.data.label, type: res.data.category || 'Unknown' };
        setWasteData(det);
        // Log the scan to backend to award XP
        if (userData?.firebaseUid && det.type !== 'Unknown') {
          axios.post(`${BASE_URL}/users/log-scan`, {
            firebaseUid: userData.firebaseUid,
            itemName: det.name,
            category: det.type,
          }).catch(() => {});
        }
      }
    } catch {}
    finally { setScanning(false); }
  };

  useEffect(() => {
    let interval;
    if (showLiveFeed) interval = setInterval(runDetection, 300);
    else { setProcessedImage(null); setWasteData({ name: '', type: '' }); }
    return () => clearInterval(interval);
  }, [showLiveFeed]);

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <GreenHeader title="Waste Scanner" />
        <View style={S.fullCenter}>
          <Text style={{ fontSize: 64, marginBottom: 16 }}>📷</Text>
          <Text style={[S.h3, { marginBottom: 8 }]}>Camera Access Needed</Text>
          <Text style={[S.body, { textAlign: 'center', marginBottom: 28, paddingHorizontal: 32 }]}>SwachhMitra needs camera to classify waste with AI.</Text>
          <TouchableOpacity style={S.btnPrimary} onPress={requestPermission}><Text style={S.btnText}>Grant Permission</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  const catColor = catColors[wasteData.type] || T.primary;
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="AI Waste Classifier" subtitle="Point camera at waste to classify" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ width: '100%', aspectRatio: 4/3, borderRadius: 20, overflow: 'hidden', backgroundColor: '#000', borderWidth: 2, borderColor: showLiveFeed ? catColor : T.border, marginBottom: 16 }}>
          {showLiveFeed
            ? (processedImage
                ? <Image source={{ uri: processedImage }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                : <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />)
            : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#111' }}>
                <Text style={{ fontSize: 64 }}>🔍</Text>
                <Text style={{ color: 'rgba(255,255,255,0.5)', marginTop: 12, fontSize: 14 }}>Camera off</Text>
              </View>}
          {scanning && (
            <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}>
              <ActivityIndicator size="small" color={T.white} style={{ marginRight: 6 }} />
              <Text style={{ color: T.white, fontSize: 12 }}>Scanning…</Text>
            </View>
          )}
        </View>
        {showLiveFeed && (
          <View style={[S.card, { borderLeftWidth: 4, borderLeftColor: catColor }]}>
            <Text style={S.label}>Detection Result</Text>
            <Text style={{ fontSize: 32, fontWeight: '900', color: catColor, marginTop: 4 }}>{wasteData.type || 'Waiting…'}</Text>
            <Text style={{ color: T.mid, fontSize: 15, marginTop: 4 }}>Item: <Text style={{ fontWeight: '700', color: T.dark }}>{wasteData.name || 'None'}</Text></Text>
            {wasteData.type ? (
              <View style={{ marginTop: 12, backgroundColor: T.bg, borderRadius: 12, padding: 12 }}>
                <Text style={{ color: T.mid, fontSize: 13 }}>
                  💡 {wasteData.type === 'Dry' ? 'Blue bin — Recyclable.' : wasteData.type === 'Wet' ? 'Green bin — Biodegradable.' : wasteData.type === 'Hazardous' ? 'Take to hazardous waste center.' : 'Certified e-waste center.'}
                </Text>
                <Text style={{ color: T.primary, fontWeight: '700', fontSize: 12, marginTop: 6 }}>+2 XP awarded!</Text>
              </View>
            ) : null}
          </View>
        )}
        <TouchableOpacity style={showLiveFeed ? S.btnDanger : S.btnPrimary} onPress={() => setShowLiveFeed(!showLiveFeed)}>
          <Text style={S.btnText}>{showLiveFeed ? '⏹  Stop Camera' : '📸  Start Primary Scan'}</Text>
        </TouchableOpacity>
        {!showLiveFeed && (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: T.border }} />
              <Text style={{ color: T.muted, paddingHorizontal: 12, fontSize: 13 }}>or</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: T.border }} />
            </View>
            <TouchableOpacity style={S.btnAccent} onPress={() => setShowFinalModal(true)}>
              <Text style={S.btnText}>🤖  Final AI Classification</Text>
            </TouchableOpacity>
            <Text style={[S.caption, { textAlign: 'center', marginTop: 10 }]}>Uses Hugging Face model for high accuracy</Text>
            <View style={{ marginTop: 24 }}>
              <Text style={[S.h3, { marginBottom: 14 }]}>Waste Category Guide</Text>
              {[
                { color: '#0288D1', emoji: '♻️', name: 'Dry Waste',  desc: 'Paper, plastic, metal, glass' },
                { color: '#388E3C', emoji: '🍃', name: 'Wet Waste',  desc: 'Food scraps, leaves, organic' },
                { color: '#D32F2F', emoji: '⚠️', name: 'Hazardous', desc: 'Batteries, chemicals, paint' },
                { color: '#7B1FA2', emoji: '💻', name: 'E-Waste',   desc: 'Electronics, cables, bulbs' },
              ].map(c => (
                <View key={c.name} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: T.card, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 4, borderLeftColor: c.color }}>
                  <Text style={{ fontSize: 24, marginRight: 14 }}>{c.emoji}</Text>
                  <View><Text style={{ fontWeight: '700', color: T.dark, fontSize: 14 }}>{c.name}</Text><Text style={S.caption}>{c.desc}</Text></View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
      <Modal visible={showFinalModal} animationType="slide" onRequestClose={() => setShowFinalModal(false)}>
        <View style={{ flex: 1 }}>
          <View style={{ paddingTop: Platform.OS === 'ios' ? 54 : 30, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: T.primary, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: T.white, fontSize: 17, fontWeight: '700' }}>🤖 Final Waste Check</Text>
            <TouchableOpacity onPress={() => setShowFinalModal(false)} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 }}>
              <Text style={{ color: T.white, fontWeight: '700' }}>Close</Text>
            </TouchableOpacity>
          </View>
          <WebView source={{ uri: 'https://huggingface.co/spaces/vanshkadam/waste-bag-classifier' }} style={{ flex: 1 }}
            startInLoadingState renderLoading={() => <View style={S.fullCenter}><ActivityIndicator size="large" color={T.primary} /></View>} />
        </View>
      </Modal>
    </View>
  );
};

// ── REWARDS ───────────────────────────────────────────────────────────────────

const RewardsScreen = ({ userData }) => {
  const [section, setSection]         = useState('leaderboard');
  const [leaderboard, setLeaderboard] = useState([]);
  const [certs, setCerts]             = useState([]);
  const [myRank, setMyRank]           = useState(null);
  const [loading, setLoading]         = useState(true);
  const medals = { 1: '🥇', 2: '🥈', 3: '🥉' };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [lbRes, certRes] = await Promise.all([
          axios.get(`${BASE_URL}/users/leaderboard`),
          axios.get(`${BASE_URL}/users/cert-progress/${userData.firebaseUid}`),
        ]);
        setLeaderboard(lbRes.data);
        const me = lbRes.data.find(u => u.firebaseUid === userData.firebaseUid);
        setMyRank(me || null);

        // Merge API cert progress with display metadata
        const CERT_META = [
          { certId: 'eco_warrior',        title: 'Eco Warrior',        emoji: '🌿', desc: 'Attended 5 cleanup drives' },
          { certId: 'water_guardian',     title: 'Water Guardian',     emoji: '💧', desc: 'Joined 2 river cleanup events' },
          { certId: 'zero_waste_hero',    title: 'Zero Waste Hero',    emoji: '♻️', desc: 'Classified 50 waste items' },
          { certId: 'community_champion', title: 'Community Champion', emoji: '🤝', desc: 'Referred 3 new volunteers' },
          { certId: 'green_streak',       title: 'Green Streak',       emoji: '🔥', desc: 'Active for 30 days in a row' },
          { certId: 'plastic_buster',     title: 'Plastic Buster',     emoji: '🏆', desc: 'Collected 100kg of plastic' },
        ];
        const progressMap = {};
        (certRes.data || []).forEach(p => { progressMap[p.certId] = p; });
        setCerts(CERT_META.map(m => ({ ...m, ...(progressMap[m.certId] || { current: 0, max: 1, earned: false }) })));
      } catch {}
      finally { setLoading(false); }
    };
    loadData();
  }, [userData.firebaseUid]);

  if (loading) return <View style={S.fullCenter}><ActivityIndicator color={T.primary} /></View>;

  const top3 = leaderboard.slice(0, 3);
  const rest  = leaderboard.slice(3);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="Rewards & Recognition" />
      <View style={{ flexDirection: 'row', margin: 20, backgroundColor: T.card, borderRadius: 14, padding: 4 }}>
        {['leaderboard', 'certificates'].map(s => (
          <TouchableOpacity key={s} onPress={() => setSection(s)}
            style={{ flex: 1, paddingVertical: 10, borderRadius: 11, backgroundColor: section === s ? T.primary : 'transparent', alignItems: 'center' }}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: section === s ? T.white : T.muted }}>
              {s === 'leaderboard' ? '🏅 Leaderboard' : '🎓 Certificates'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
        {section === 'leaderboard' && (
          <>
            {/* My rank card */}
            <View style={[S.cardGreen, { flexDirection: 'row', alignItems: 'center' }]}>
              <View style={S.avatarLg}><Text style={S.avatarTextLg}>{(userData?.name || 'U').charAt(0)}</Text></View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '700' }}>YOUR RANK</Text>
                <Text style={{ color: T.white, fontSize: 32, fontWeight: '900' }}>
                  {myRank ? `#${myRank.rank}` : 'Unranked'}
                </Text>
                <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>
                  {userData.xp || 0} XP · {userData.badges?.length || 0} Badges
                </Text>
              </View>
              <Text style={{ fontSize: 40 }}>🏅</Text>
            </View>

            {/* Podium */}
            {top3.length >= 3 && (
              <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: 20 }}>
                <View style={{ alignItems: 'center', marginRight: 8 }}>
                  <Text style={{ fontSize: 22 }}>🥈</Text>
                  <View style={{ width: 64, height: 80, backgroundColor: '#CFD8DC', borderTopLeftRadius: 12, borderTopRightRadius: 12, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 8 }}>
                    <Text style={{ fontSize: 22, fontWeight: '800' }}>{top3[1].avatar}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: T.mid }}>2nd</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center', marginHorizontal: 4 }}>
                  <Text style={{ fontSize: 28 }}>🥇</Text>
                  <View style={{ width: 72, height: 100, backgroundColor: T.gold, borderTopLeftRadius: 12, borderTopRightRadius: 12, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 8 }}>
                    <Text style={{ fontSize: 26, fontWeight: '800' }}>{top3[0].avatar}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#4a3000' }}>1st</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'center', marginLeft: 8 }}>
                  <Text style={{ fontSize: 20 }}>🥉</Text>
                  <View style={{ width: 64, height: 64, backgroundColor: '#FFCCBC', borderTopLeftRadius: 12, borderTopRightRadius: 12, justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 8 }}>
                    <Text style={{ fontSize: 20, fontWeight: '800' }}>{top3[2].avatar}</Text>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: T.mid }}>3rd</Text>
                  </View>
                </View>
              </View>
            )}

            <Text style={[S.label, { marginBottom: 14 }]}>Full Rankings</Text>
            {leaderboard.map(e => {
              const isMe = e.firebaseUid === userData.firebaseUid;
              return (
                <View key={e.firebaseUid} style={[S.card, { flexDirection: 'row', alignItems: 'center', padding: 14, borderWidth: isMe ? 2 : 0, borderColor: isMe ? T.primary : 'transparent' }]}>
                  <Text style={{ fontSize: 22, width: 36, textAlign: 'center' }}>{medals[e.rank] || `#${e.rank}`}</Text>
                  <View style={[S.avatar, { marginHorizontal: 12 }]}><Text style={S.avatarText}>{e.avatar}</Text></View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: T.dark, fontSize: 15 }}>{e.name}{isMe ? ' (You)' : ''}</Text>
                    <Text style={{ color: T.muted, fontSize: 12 }}>{e.badges} badges · {e.xp} XP</Text>
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: T.primary }}>{e.xp}</Text>
                </View>
              );
            })}
          </>
        )}

        {section === 'certificates' && (
          <>
            <Text style={[S.label, { marginBottom: 14 }]}>Your Achievements</Text>
            {certs.map((c, i) => (
              <View key={i} style={[S.card, { flexDirection: 'row', alignItems: 'center', opacity: c.earned ? 1 : 0.78, borderLeftWidth: 4, borderLeftColor: c.earned ? T.primary : T.border }]}>
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c.earned ? '#E8F5E9' : T.bg, justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
                  <Text style={{ fontSize: 28 }}>{c.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: T.dark, fontSize: 15 }}>{c.title}</Text>
                  <Text style={{ color: T.muted, fontSize: 12, marginTop: 2 }}>{c.desc}</Text>
                  {c.earned ? (
                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                      <View style={{ backgroundColor: '#E8F5E9', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 }}>
                        <Text style={{ color: T.primary, fontSize: 11, fontWeight: '700' }}>
                          ✓ Earned {c.earnedAt ? new Date(c.earnedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <View style={{ marginTop: 8 }}>
                      <Text style={{ color: T.muted, fontSize: 12, marginBottom: 4 }}>Progress: {c.current}/{c.max}</Text>
                      <View style={{ height: 5, backgroundColor: T.border, borderRadius: 3 }}>
                        <View style={{ height: '100%', width: `${Math.min((c.current / c.max) * 100, 100)}%`, backgroundColor: T.accent, borderRadius: 3 }} />
                      </View>
                    </View>
                  )}
                </View>
                {c.earned && (
                  <TouchableOpacity style={{ backgroundColor: T.primary, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, marginLeft: 8 }}>
                    <Text style={{ color: T.white, fontSize: 11, fontWeight: '700' }}>Share</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

// ── REPORTS ───────────────────────────────────────────────────────────────────

const ReportsScreen = ({ userData }) => {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE_URL}/events/volunteer-report/${userData.firebaseUid}`)
      .then(r => setReport(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userData.firebaseUid]);

  const breakdown = [
    { type: 'Dry Waste',  pct: 48, color: '#0288D1', emoji: '♻️' },
    { type: 'Wet Waste',  pct: 31, color: '#388E3C', emoji: '🍃' },
    { type: 'Hazardous',  pct: 13, color: '#D32F2F', emoji: '⚠️' },
    { type: 'E-Waste',    pct:  8, color: '#7B1FA2', emoji: '💻' },
  ];

  // Build monthly bar chart from real data (last 6 months)
  const monthly = (report?.monthlyActivity || []).slice(-6);
  const maxKg   = Math.max(...monthly.map(m => m.kgCollected || 1), 1);

  if (loading) return <View style={S.fullCenter}><ActivityIndicator color={T.primary} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="My Impact Report" subtitle="Your environmental footprint" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: 8 }}>
          <StatBox emoji="🗓️" value={String(report?.totalEventsJoined || 0)}  label={'Events\nAttended'} />
          <StatBox emoji="♻️" value={String(report?.totalScans || 0)}          label={'Items\nClassified'} />
          <StatBox emoji="⏱️" value={`${report?.totalHoursVolunteered || 0}h`} label={'Time\nVolunteered'} />
          <StatBox emoji="🌍" value={`${(report?.co2SavedTons || 0).toFixed(1)}t`} label={'CO₂\nSaved'} />
        </View>

        {monthly.length > 0 && (
          <View style={S.card}>
            <Text style={[S.h3, { marginBottom: 4 }]}>Monthly Activity</Text>
            <Text style={[S.caption, { marginBottom: 20 }]}>Waste collected (kg) per month</Text>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 120, justifyContent: 'space-between' }}>
              {monthly.map(m => (
                <View key={m.month} style={{ alignItems: 'center', flex: 1 }}>
                  <Text style={{ fontSize: 11, color: T.primary, fontWeight: '700', marginBottom: 4 }}>
                    {Math.round(m.kgCollected || 0)}
                  </Text>
                  <View style={{ width: 28, height: ((m.kgCollected || 0) / maxKg) * 90, backgroundColor: T.primary, borderRadius: 6 }} />
                  <Text style={{ fontSize: 10, color: T.muted, marginTop: 6 }}>{m.month?.slice(5)}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={S.card}>
          <Text style={[S.h3, { marginBottom: 16 }]}>Waste Type Breakdown</Text>
          {breakdown.map(w => (
            <View key={w.type} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontWeight: '600', color: T.dark, fontSize: 13 }}>{w.emoji}  {w.type}</Text>
                <Text style={{ fontWeight: '700', color: w.color, fontSize: 13 }}>{w.pct}%</Text>
              </View>
              <View style={{ height: 8, backgroundColor: T.border, borderRadius: 4 }}>
                <View style={{ height: '100%', width: `${w.pct}%`, backgroundColor: w.color, borderRadius: 4 }} />
              </View>
            </View>
          ))}
        </View>

        <View style={S.card}>
          <Text style={[S.h3, { marginBottom: 8 }]}>Streak & Level</Text>
          <View style={{ flexDirection: 'row', marginHorizontal: -4 }}>
            <StatBox emoji="🔥" value={String(report?.streak || 0)} label="Day Streak" />
            <StatBox emoji="⭐" value={`Lv ${report?.level || 1}`} label="Current Level" />
            <StatBox emoji="🏅" value={String(report?.badges?.length || 0)} label="Badges" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ── EVENTS ────────────────────────────────────────────────────────────────────

function parseTimeToHmClient(timeStr) {
  if (!timeStr) return { h: 0, m: 0 };
  const s = String(timeStr).trim().replace(/\u00a0/g, ' ');
  const m = s.match(/^(\d{1,2})\s*:\s*(\d{2})(?:\s*:\s*(\d{2}))?/);
  if (!m) return { h: 0, m: 0 };
  let h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (min > 59 || h > 23) return { h: 0, m: 0 };

  const low = s.toLowerCase().replace(/\./g, '');
  const hasPm = /\bpm\b|^pm|pm$|pm\s|p\s*m/.test(low) || low.includes('p.m');
  const hasAm = (/\bam\b|^am|am$|am\s|a\s*m/.test(low) || low.includes('a.m')) && !hasPm;

  if (hasPm && h !== 12) h += 12;
  else if (hasAm && h === 12) h = 0;
  else if (!hasPm && !hasAm) {
    if (h >= 13) { /* 24h */ }
    else if (h >= 1 && h <= 11) h += 12;
  }

  return { h, m: min };
}

/** Must match backend geofenceHelper (India events). Never use ISO date.substring — it is UTC day and breaks IST. */
const GEOFENCE_TZ = 'Asia/Kolkata';
const GEOFENCE_TZ_OFFSET = '+05:30';

function eventDateYmdFromEv(ev) {
  if (ev.geofenceDateYmd && /^\d{4}-\d{2}-\d{2}$/.test(ev.geofenceDateYmd)) return ev.geofenceDateYmd;
  const raw = ev.date;
  if (raw == null || raw === '') return '1970-01-01';
  if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.trim().slice(0, 10))) return raw.trim().slice(0, 10);
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return '1970-01-01';
  try {
    return d.toLocaleDateString('en-CA', { timeZone: GEOFENCE_TZ });
  } catch {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    return `${y}-${mo}-${da}`;
  }
}

function combineLocalWallClockMs(ymd, timeStr) {
  const { h, m } = parseTimeToHmClient(timeStr);
  if (!ymd || !/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return NaN;
  const iso = `${ymd}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00${GEOFENCE_TZ_OFFSET}`;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) ? t : NaN;
}

function formatCountdownHms(ms) {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map(n => String(n).padStart(2, '0')).join(':');
}

const EventGeofenceScreen = ({ ev, userData, onBack }) => {
  const [started, setStarted]       = useState(false);
  const [displayLine, setDisplayLine] = useState('');
  const [geoStatus, setGeoStatus]   = useState('—');
  const [coordsTxt, setCoordsTxt]   = useState('');
  const lastPingRef = useRef(0);

  // Prefer backend-calculated instants; if the backend timestamps were created
  // before timezone fixes, fall back to wall-clock `date + time/endTime`.
  const serverStartMs = ev.geofenceStartAt ? new Date(ev.geofenceStartAt).getTime() : NaN;
  const serverEndMs   = ev.geofenceEndAt ? new Date(ev.geofenceEndAt).getTime() : NaN;

  const dateKey = eventDateYmdFromEv(ev);
  const clientStartMs = ev.time ? combineLocalWallClockMs(dateKey, ev.time) : NaN;
  const clientEndMs   = ev.endTime ? combineLocalWallClockMs(dateKey, ev.endTime) : NaN;

  const nowMs = Date.now();
  const useClient =
    // Backend says window already ended, but wall-clock still looks valid.
    (Number.isFinite(serverEndMs) && serverEndMs < nowMs) &&
    Number.isFinite(clientStartMs) &&
    Number.isFinite(clientEndMs) &&
    clientEndMs >= nowMs;

  const startMs = useClient ? clientStartMs : serverStartMs;
  const endMs   = useClient ? clientEndMs : serverEndMs;
  const hasFence =
    (ev.geofenceLat != null && ev.geofenceLng != null) ||
    (ev.geofenceCoordinates && ev.geofenceCoordinates.length);

  useEffect(() => {
    if (!started) return undefined;
    const iv = setInterval(async () => {
      const now = Date.now();
      if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || !hasFence) return;

      if (now < startMs) {
        setDisplayLine(`Geofencing starting in ${formatCountdownHms(startMs - now)}`);
        setGeoStatus('waiting');
        lastPingRef.current = 0;
        return;
      }

      if (now > endMs) {
        setDisplayLine('Geofencing has ended for this event.');
        setGeoStatus('ended');
        return;
      }

      setDisplayLine('Tracking your location for attendance…');

      if (now - lastPingRef.current < 5000) return;

      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lastPingRef.current = now;
        setCoordsTxt(`${loc.coords.latitude.toFixed(5)}, ${loc.coords.longitude.toFixed(5)}`);
        const res = await axios.post(`${BACKEND_URL}/api/events/geofence/location`, {
          eventId: ev._id,
          firebaseUid: userData.firebaseUid,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          timestamp: Math.floor(Date.now() / 1000),
        });
        if (res.data.reason === 'before_start') setGeoStatus('waiting');
        else if (res.data.reason === 'after_end') setGeoStatus('ended');
        else if (res.data.inside) setGeoStatus('inside');
        else setGeoStatus('outside');
      } catch {
        setGeoStatus('error');
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [started, startMs, endMs, hasFence, ev._id, userData.firebaseUid]);

  const handleStart = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Location needed', 'Allow location to record attendance at the venue.');
      return;
    }
    setStarted(true);
  };

  if (!hasFence || !Number.isFinite(startMs) || !Number.isFinite(endMs)) {
    return (
      <View style={{ flex: 1, backgroundColor: T.bg }}>
        <GreenHeader title="Attendance" onBack={onBack} bgColor={T.primary} />
        <View style={{ padding: 24 }}>
          <Text style={S.body}>Geofencing is not set up for this event. Create a new event so the venue can be located for the fence.</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title={ev.name} subtitle="Attendance & geofence" onBack={onBack} bgColor={T.primary} />
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={S.card}>
          <Text style={[S.caption, { marginBottom: 8 }]}>📍 {ev.location}</Text>
          <Text style={S.body}>Window: {ev.time} – {ev.endTime}</Text>
        </View>
        {!started ? (
          <TouchableOpacity style={S.btnPrimary} onPress={handleStart}>
            <Text style={S.btnText}>Start attendance</Text>
          </TouchableOpacity>
        ) : (
          <View style={[S.card, { marginTop: 16 }]}>
            <Text style={[S.h3, { marginBottom: 8 }]}>Geofencing</Text>
            <Text style={[S.body, { marginBottom: 12 }]}>{displayLine}</Text>
            {coordsTxt ? <Text style={[S.caption, { marginBottom: 8 }]}>Last fix: {coordsTxt}</Text> : null}
            {geoStatus === 'inside' && <Text style={{ color: T.primary, fontWeight: '700' }}>● Inside cleanup zone</Text>}
            {geoStatus === 'outside' && <Text style={{ color: T.danger, fontWeight: '700' }}>● Outside zone — move closer to the venue</Text>}
            {geoStatus === 'waiting' && <Text style={{ color: T.muted }}>Stay on this screen until the session starts.</Text>}
            {geoStatus === 'ended' && <Text style={{ color: T.muted }}>You can go back. The organiser will see your attendance status.</Text>}
            {geoStatus === 'error' && <Text style={{ color: T.danger }}>Could not send location. Check connection.</Text>}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const OrganiserEventDetailScreen = ({ userData, ev, onBack }) => {
  const [rows, setRows]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/events/${ev._id}/geofence-attendance`, { params: { organiserUid: userData.firebaseUid } })
      .then(r => setRows(r.data.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [ev._id, userData.firebaseUid]);

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title={ev.name} subtitle="Attendance" onBack={onBack} bgColor={T.accent} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={S.card}>
          <Text style={[S.h3, { marginBottom: 16 }]}>Volunteer attendance</Text>
          {loading ? <ActivityIndicator color={T.accent} /> : null}
          {!loading && rows.length === 0 && (
            <Text style={S.body}>No registered volunteers yet.</Text>
          )}
          {!loading &&
            rows.map((r, i) => (
              <View
                key={r.firebaseUid || i}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  paddingVertical: 12,
                  borderBottomWidth: i < rows.length - 1 ? 1 : 0,
                  borderBottomColor: T.border,
                }}>
                <Text style={{ fontWeight: '600', color: T.dark, flex: 1 }}>{r.name}</Text>
                <Text style={{ fontWeight: '700', color: r.status === 'present' ? T.primary : T.danger }}>
                  {r.status === 'present' ? 'Present' : 'Absent'}
                </Text>
              </View>
            ))}
        </View>
      </ScrollView>
    </View>
  );
};

const EventsScreen = ({ userData, events, loading, onRegister, onLeave, onOpenGeofence }) => {
  const [filter, setFilter] = useState('All');
  const filtered = events.filter(ev => {
    if (filter === 'Joined') return ev.participants?.includes(userData?.firebaseUid);
    return true;
  });
  if (loading) return <View style={S.fullCenter}><ActivityIndicator size="large" color={T.primary} /><Text style={{ color: T.muted, marginTop: 12 }}>Loading events…</Text></View>;
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="Cleanup Events" subtitle="Join a drive near you" />
      <View style={{ flexDirection: 'row', padding: 16, paddingBottom: 4 }}>
        {['All', 'Upcoming', 'Joined'].map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8, backgroundColor: filter === f ? T.primary : T.card, borderWidth: 1, borderColor: filter === f ? T.primary : T.border }}>
            <Text style={{ fontWeight: '700', fontSize: 13, color: filter === f ? T.white : T.mid }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 56, marginBottom: 12 }}>🗓️</Text>
            <Text style={S.h3}>No events found</Text>
            <Text style={[S.body, { textAlign: 'center', marginTop: 4 }]}>Check back later for new drives</Text>
          </View>
        )}
        {filtered.map(ev => {
          const uid       = userData?.firebaseUid;
          const idx       = ev.participants ? ev.participants.indexOf(uid) : -1;
          const isEnrolled = idx !== -1;
          const isWaiting  = isEnrolled && idx >= ev.volunteersRequired;
          const spotsLeft  = Math.max(0, ev.volunteersRequired - (ev.participants?.length || 0));
          return (
            <View key={ev._id} style={[S.card, { padding: 0, overflow: 'hidden' }]}>
              <Image source={{ uri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600' }}
                style={{ width: '100%', height: 140, borderTopLeftRadius: 20, borderTopRightRadius: 20 }} />
              {isEnrolled && !isWaiting && (
                <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: T.primary, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ color: T.white, fontWeight: '700', fontSize: 12 }}>✓ Joined</Text>
                </View>
              )}
              {isWaiting && (
                <View style={{ position: 'absolute', top: 12, right: 12, backgroundColor: T.gold, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 5 }}>
                  <Text style={{ color: '#4a3000', fontWeight: '700', fontSize: 12 }}>⏳ Queue #{idx - ev.volunteersRequired + 1}</Text>
                </View>
              )}
              <View style={{ padding: 16 }}>
                <Text style={[S.h3, { marginBottom: 8 }]}>{ev.name}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
                  <View style={[S.chip, { marginRight: 8 }]}><Text style={{ fontSize: 12, color: T.mid }}>📍 {ev.location}</Text></View>
                  <View style={S.chip}><Text style={{ fontSize: 12, color: T.mid }}>📅 {new Date(ev.date).toDateString()}</Text></View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                  <Text style={{ fontSize: 13, color: T.muted }}>
                    <Text style={{ fontWeight: '700', color: spotsLeft > 0 ? T.primary : T.danger }}>{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}</Text>
                    {' '}of {ev.volunteersRequired}
                  </Text>
                  <Text style={{ fontSize: 12, color: T.muted }}>
                    ⏰ {ev.time}{ev.endTime ? ` – ${ev.endTime}` : ''}
                  </Text>
                </View>
                <View style={{ height: 6, backgroundColor: T.border, borderRadius: 3, marginBottom: 14 }}>
                  <View style={{ height: '100%', width: `${Math.min(((ev.participants?.length || 0) / ev.volunteersRequired) * 100, 100)}%`, backgroundColor: spotsLeft > 0 ? T.primary : T.danger, borderRadius: 3 }} />
                </View>
                <TouchableOpacity style={isEnrolled ? S.btnDanger : S.btnPrimary} onPress={() => isEnrolled ? onLeave(ev._id) : onRegister(ev._id)}>
                  <Text style={S.btnText}>{isEnrolled ? 'Leave Event' : 'Register Now'}</Text>
                </TouchableOpacity>
                {isEnrolled && !isWaiting && onOpenGeofence ? (
                  <TouchableOpacity style={[S.btnAccent, { marginTop: 12 }]} onPress={() => onOpenGeofence(ev)}>
                    <Text style={S.btnText}>📍  Start attendance</Text>
                  </TouchableOpacity>
                ) : null}
                {isWaiting && <Text style={{ fontSize: 11, color: '#b45309', marginTop: 8, textAlign: 'center', fontStyle: 'italic' }}>You'll move up automatically if someone leaves.</Text>}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

// ── ADD EVENT / MY EVENTS ─────────────────────────────────────────────────────

function padTimePart(n) {
  return String(n).padStart(2, '0');
}

function parseTimePartsForModal(str) {
  const s = String(str || '').trim();
  const m = s.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?/i);
  if (m) {
    let h = parseInt(m[1], 10);
    const mm = parseInt(m[2], 10);
    const ss = m[3] != null ? parseInt(m[3], 10) : 0;
    let ap = (m[4] || 'PM').toUpperCase();
    if (ap !== 'AM' && ap !== 'PM') ap = 'PM';
    let h24 = h;
    if (ap === 'PM' && h !== 12) h24 = h + 12;
    if (ap === 'AM' && h === 12) h24 = 0;
    const pm = h24 >= 12;
    let h12 = h24 % 12;
    if (h12 === 0) h12 = 12;
    return { h12, mm, ss: Math.min(59, Math.max(0, ss || 0)), ap: pm ? 'PM' : 'AM' };
  }
  return { h12: 7, mm: 0, ss: 0, ap: 'PM' };
}

function formatTimeFromParts({ h12, mm, ss, ap }) {
  return `${h12}:${padTimePart(mm)}:${padTimePart(ss)} ${ap}`;
}

const HOURS_12 = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

const TimePickerModal = ({ visible, title, value, onClose, onConfirm }) => {
  const init = parseTimePartsForModal(value);
  const [h12, setH12] = useState(init.h12);
  const [mm, setMm]   = useState(init.mm);
  const [ss, setSs]   = useState(init.ss);
  const [ap, setAp]   = useState(init.ap);

  useEffect(() => {
    if (visible) {
      const p = parseTimePartsForModal(value);
      setH12(p.h12);
      setMm(p.mm);
      setSs(p.ss);
      setAp(p.ap);
    }
  }, [visible, value]);

  const pickerH = Platform.OS === 'ios' ? 200 : 56;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 }}>
        <View style={[S.card, { marginBottom: 0 }]}>
          <Text style={[S.h3, { marginBottom: 12 }]}>{title}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 }}>
            <View style={{ flex: 1, minWidth: 72 }}>
              <Text style={S.caption}>Hour</Text>
              <Picker selectedValue={h12} onValueChange={v => setH12(v)} style={{ height: pickerH }}>
                {HOURS_12.map(h => (
                  <Picker.Item key={h} label={padTimePart(h)} value={h} />
                ))}
              </Picker>
            </View>
            <View style={{ flex: 1, minWidth: 72 }}>
              <Text style={S.caption}>Minute</Text>
              <Picker selectedValue={mm} onValueChange={v => setMm(v)} style={{ height: pickerH }}>
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item key={i} label={padTimePart(i)} value={i} />
                ))}
              </Picker>
            </View>
            <View style={{ flex: 1, minWidth: 72 }}>
              <Text style={S.caption}>Second</Text>
              <Picker selectedValue={ss} onValueChange={v => setSs(v)} style={{ height: pickerH }}>
                {Array.from({ length: 60 }, (_, i) => (
                  <Picker.Item key={i} label={padTimePart(i)} value={i} />
                ))}
              </Picker>
            </View>
            <View style={{ flex: 1, minWidth: 88 }}>
              <Text style={S.caption}> </Text>
              <Picker selectedValue={ap} onValueChange={v => setAp(v)} style={{ height: pickerH }}>
                <Picker.Item label="AM" value="AM" />
                <Picker.Item label="PM" value="PM" />
              </Picker>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16, marginTop: 8 }}>
            <TouchableOpacity onPress={onClose} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
              <Text style={{ fontWeight: '700', color: T.mid }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onConfirm(formatTimeFromParts({ h12, mm, ss, ap }))}
              style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
              <Text style={{ fontWeight: '800', color: T.primary }}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const AddEventForm = ({ userData, onBack, onSuccess }) => {
  const today = new Date();
  const defY = today.getFullYear();
  const defM = String(today.getMonth() + 1).padStart(2, '0');
  const defD = String(today.getDate()).padStart(2, '0');
  const defYmd = `${defY}-${defM}-${defD}`;

  const [data, setData] = useState({
    name: '',
    date: defYmd,
    time: '7:00:00 PM',
    endTime: '8:00:00 PM',
    volunteers: '',
    location: '',
    geofenceCoordinates: null,
  });
  const [loading, setLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [mapCenter, setMapCenter] = useState([19.076, 72.8777]);
  const [showDate, setShowDate] = useState(false);
  const [dateVal, setDateVal]   = useState(() => new Date(`${defYmd}T12:00:00`));
  const [showStartTime, setShowStartTime] = useState(false);
  const [showEndTime, setShowEndTime]     = useState(false);

  const openMapPicker = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    let c = [19.076, 72.8777];
    if (status === 'granted') {
      try {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        c = [loc.coords.latitude, loc.coords.longitude];
      } catch { /* default Mumbai */ }
    }
    setMapCenter(c);
    setMapOpen(true);
  };

  const onDateChange = (event, selected) => {
    if (Platform.OS === 'android') setShowDate(false);
    if (event?.type === 'dismissed') return;
    if (!selected) return;
    setDateVal(selected);
    const y = selected.getFullYear();
    const mo = String(selected.getMonth() + 1).padStart(2, '0');
    const da = String(selected.getDate()).padStart(2, '0');
    setData(prev => ({ ...prev, date: `${y}-${mo}-${da}` }));
  };

  const handleSubmit = async () => {
    const ring = data.geofenceCoordinates && data.geofenceCoordinates[0];
    if (!data.name || !data.date || !data.time || !data.endTime || !data.volunteers) {
      Alert.alert('Missing Info', 'Please fill in all required fields.'); return;
    }
    if (!ring || ring.length < 4) {
      Alert.alert('Map area', 'Open the map and tap at least 3 corners, then tap “Use this area”.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/events/create`, {
        organiserUid: userData.firebaseUid,
        name: data.name,
        date: data.date,
        time: data.time,
        endTime: data.endTime,
        volunteersRequired: Number(data.volunteers),
        location: (data.location || '').trim() || 'Geofenced area',
        geofenceCoordinates: data.geofenceCoordinates,
      });
      Alert.alert('Success! 🎉', 'Event is now live!');
      onSuccess();
    } catch { Alert.alert('Error', 'Failed to create event.'); }
    finally { setLoading(false); }
  };

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="Create Event" onBack={onBack} bgColor={T.accent} />
      <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
        <View style={S.card}>
          <StyledInput label="Event Name" placeholder="e.g. Marine Drive Cleanup" value={data.name} onChangeText={t => setData({ ...data, name: t })} />
          <View style={S.inputWrap}>
            <Text style={S.inputLabel}>Date</Text>
            {Platform.OS === 'web' ? (
              createElement('input', {
                type: 'date',
                value: data.date,
                onChange: (e) => {
                  const v = e?.target?.value;
                  if (!v) return;
                  setData((prev) => ({ ...prev, date: v }));
                  setDateVal(new Date(`${v}T12:00:00`));
                },
                style: {
                  width: '100%',
                  boxSizing: 'border-box',
                  backgroundColor: T.white,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  fontSize: 15,
                  color: T.dark,
                  fontWeight: 600,
                  outline: 'none',
                  fontFamily: 'inherit',
                },
              })
            ) : (
              <>
                <TouchableOpacity onPress={() => setShowDate(true)} style={[S.input, { justifyContent: 'center' }]}>
                  <Text style={{ fontSize: 15, color: T.dark, fontWeight: '600' }}>{data.date}</Text>
                </TouchableOpacity>
                {showDate ? (
                  <DateTimePicker
                    value={dateVal}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onDateChange}
                  />
                ) : null}
                {showDate && Platform.OS === 'ios' ? (
                  <TouchableOpacity onPress={() => setShowDate(false)} style={{ alignItems: 'center', paddingVertical: 8 }}>
                    <Text style={{ fontWeight: '700', color: T.accent }}>Done</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
          <View style={S.inputWrap}>
            <Text style={S.inputLabel}>Start time</Text>
            <TouchableOpacity onPress={() => setShowStartTime(true)} style={[S.input, { justifyContent: 'center' }]}>
              <Text style={{ fontSize: 15, color: T.dark, fontWeight: '600' }}>{data.time}</Text>
            </TouchableOpacity>
          </View>
          <View style={S.inputWrap}>
            <Text style={S.inputLabel}>End time</Text>
            <TouchableOpacity onPress={() => setShowEndTime(true)} style={[S.input, { justifyContent: 'center' }]}>
              <Text style={{ fontSize: 15, color: T.dark, fontWeight: '600' }}>{data.endTime}</Text>
            </TouchableOpacity>
          </View>
          <StyledInput
            label="Venue label (optional)"
            placeholder="Shown in lists, e.g. Kandivali East"
            value={data.location}
            onChangeText={t => setData({ ...data, location: t })}
          />
          <View style={S.inputWrap}>
            <Text style={S.inputLabel}>Cleanup area (map)</Text>
            <TouchableOpacity onPress={openMapPicker} style={[S.btnOutline, { borderColor: T.accent }]}>
              <Text style={{ color: T.accent, fontWeight: '800' }}>
                {data.geofenceCoordinates ? '✓ Area set — change on map' : 'Open map & draw polygon'}
              </Text>
            </TouchableOpacity>
          </View>
          <StyledInput label="Volunteers Required" placeholder="e.g. 30" value={data.volunteers} onChangeText={t => setData({ ...data, volunteers: t })} keyboardType="numeric" />
        </View>
        <TouchableOpacity onPress={handleSubmit} disabled={loading} style={[S.btnPrimary, loading && S.btnDisabled]}>
          {loading ? <ActivityIndicator color={T.white} /> : <Text style={S.btnText}>🎉  Publish Event</Text>}
        </TouchableOpacity>
      </ScrollView>
      <TimePickerModal
        visible={showStartTime}
        title="Select start time"
        value={data.time}
        onClose={() => setShowStartTime(false)}
        onConfirm={t => { setData(prev => ({ ...prev, time: t })); setShowStartTime(false); }}
      />
      <TimePickerModal
        visible={showEndTime}
        title="Select end time"
        value={data.endTime}
        onClose={() => setShowEndTime(false)}
        onConfirm={t => { setData(prev => ({ ...prev, endTime: t })); setShowEndTime(false); }}
      />
      <LeafletPolygonPicker
        visible={mapOpen}
        mapCenter={mapCenter}
        onClose={() => setMapOpen(false)}
        onConfirm={coords => {
          setData(prev => ({ ...prev, geofenceCoordinates: coords }));
          setMapOpen(false);
        }}
      />
    </View>
  );
};

const MyEventsScreen = ({ userData, onAddNew, onSelectEvent }) => {
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(null); // eventId being completed

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/events/organiser-stats/${userData.firebaseUid}`)
      .then(r => setEvents(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleComplete = async (ev) => {
    // Mark all current participants as attended (simplification — real app would have check-in)
    setCompleting(ev._id);
    try {
      await axios.post(`${BACKEND_URL}/api/events/complete`, {
        eventId:      ev._id,
        organiserUid: userData.firebaseUid,
        attendedUids: ev.participants || [],
        kgCollected:  0,   // organiser can update later
      });
      Alert.alert('✅ Event Completed', 'XP awarded to all participants!');
      // Refresh list
      const r = await axios.get(`${BACKEND_URL}/api/events/organiser-stats/${userData.firebaseUid}`);
      setEvents(r.data);
    } catch { Alert.alert('Error', 'Could not complete event.'); }
    finally { setCompleting(null); }
  };

  if (loading) return <View style={S.fullCenter}><ActivityIndicator color={T.primary} /></View>;
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="My Events" bgColor={T.accent} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <TouchableOpacity style={[S.btnAccent, { marginBottom: 20 }]} onPress={onAddNew}>
          <Text style={S.btnText}>＋  Create New Event</Text>
        </TouchableOpacity>
        {events.length === 0 && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ fontSize: 56 }}>📭</Text>
            <Text style={[S.h3, { marginTop: 12 }]}>No Events Yet</Text>
            <Text style={[S.body, { textAlign: 'center' }]}>Create your first cleanup event above</Text>
          </View>
        )}
        {events.map(ev => (
          <View key={ev._id} style={S.card}>
            <TouchableOpacity activeOpacity={0.85} onPress={() => onSelectEvent?.(ev)}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <Text style={[S.h3, { flex: 1 }]}>{ev.name}</Text>
                <View style={[S.tag, { backgroundColor: ev.status === 'completed' ? '#E8F5E9' : T.accentLight }]}>
                  <Text style={[S.tagText, { color: ev.status === 'completed' ? T.primary : T.accent }]}>
                    {ev.status === 'completed' ? '✓ Done' : `${ev.participants?.length || 0} joined`}
                  </Text>
                </View>
              </View>
              <Text style={[S.body, { marginBottom: 10 }]}>📍 {ev.location}  ·  📅 {new Date(ev.date).toDateString()}</Text>
              <Text style={[S.caption, { marginBottom: 6 }]}>Tap for geofence attendance table →</Text>
            </TouchableOpacity>
            <View style={{ height: 8, backgroundColor: T.border, borderRadius: 4, marginBottom: 8 }}>
              <View style={{ height: '100%', width: `${Math.min(((ev.participants?.length || 0) / ev.volunteersRequired) * 100, 100)}%`, backgroundColor: T.primary, borderRadius: 4 }} />
            </View>
            <Text style={[S.caption, { marginBottom: 12 }]}>Capacity: {ev.participants?.length || 0} / {ev.volunteersRequired}</Text>
            {ev.status !== 'completed' && (
              <TouchableOpacity
                onPress={() => handleComplete(ev)}
                disabled={completing === ev._id}
                style={[S.btnAccent, { paddingVertical: 12 }, completing === ev._id && S.btnDisabled]}>
                {completing === ev._id
                  ? <ActivityIndicator color={T.white} />
                  : <Text style={S.btnText}>✅  Mark as Completed</Text>}
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ── ANALYTICS (Organiser) ─────────────────────────────────────────────────────

const AnalyticsScreen = ({ userData }) => {
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${BASE_URL}/users/organiser-stats/${userData.firebaseUid}`)
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={S.fullCenter}><ActivityIndicator color={T.accent} /></View>;

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="Event Analytics" bgColor={T.accent} />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: 16 }}>
          <StatBox emoji="🗓️" value={String(stats?.eventsCreated || 0)}            label={'Events\nCreated'} />
          <StatBox emoji="👥" value={String(stats?.totalVolunteersManaged || 0)}   label={'Total\nVolunteers'} />
          <StatBox emoji="⭐" value={String(stats?.avgEventRating || 0)}           label={'Avg\nRating'} />
        </View>
        <View style={S.card}>
          <Text style={[S.h3, { marginBottom: 16 }]}>Event Performance</Text>
          {(stats?.events || []).slice(0, 6).map(ev => (
            <View key={ev._id} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: T.dark, flex: 1 }}>{ev.name}</Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: T.primary }}>
                  {ev.participants?.length || 0}/{ev.volunteersRequired}
                </Text>
              </View>
              <View style={{ height: 10, backgroundColor: T.border, borderRadius: 5 }}>
                <View style={{ height: '100%', width: `${Math.min(((ev.participants?.length || 0) / ev.volunteersRequired) * 100, 100)}%`, backgroundColor: T.accent, borderRadius: 5 }} />
              </View>
            </View>
          ))}
          {(!stats?.events || stats.events.length === 0) && (
            <Text style={[S.body, { textAlign: 'center', paddingVertical: 20 }]}>No events yet. Create one to see analytics.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

// ── SETTINGS ──────────────────────────────────────────────────────────────────

const SettingsScreen = ({ userData, handleLogout }) => {
  const roleEmoji = { volunteer: '🌿', organiser: '📋', csr: '🏢' };
  const roleName  = { volunteer: 'Volunteer', organiser: 'Organiser', csr: 'CSR Partner' };
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="Profile & Settings" />
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={[S.cardGreen, { alignItems: 'center', paddingVertical: 32 }]}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
            <Text style={{ color: T.white, fontWeight: '800', fontSize: 36 }}>{(userData?.name || 'U').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{ color: T.white, fontSize: 22, fontWeight: '800' }}>{userData?.name}</Text>
          <Text style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4, fontSize: 14 }}>{userData?.email}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, marginTop: 14 }}>
            <Text style={{ fontSize: 18, marginRight: 6 }}>{roleEmoji[userData?.role] || '👤'}</Text>
            <Text style={{ color: T.white, fontWeight: '700', fontSize: 13 }}>{roleName[userData?.role] || userData?.role}</Text>
          </View>
        </View>
        <View style={S.card}>
          <Text style={[S.label, { marginBottom: 14 }]}>Account Information</Text>
          {[
            { label: 'Full Name',     value: userData?.name     || '—', emoji: '👤' },
            { label: 'Email',         value: userData?.email    || '—', emoji: '📧' },
            { label: 'Location',      value: userData?.location || '—', emoji: '📍' },
            { label: 'Member Since',  value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—', emoji: '📅' },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: T.border }}>
              <Text style={{ fontSize: 20, marginRight: 14 }}>{item.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={S.caption}>{item.label}</Text>
                <Text style={{ fontWeight: '600', color: T.dark, fontSize: 14, marginTop: 1 }}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
        <View style={S.card}>
          <Text style={[S.label, { marginBottom: 14 }]}>Preferences</Text>
          {[
            { emoji: '🔔', label: 'Push Notifications' },
            { emoji: '🔒', label: 'Privacy Settings' },
            { emoji: '❓', label: 'Help & Support' },
            { emoji: '📋', label: 'Terms of Service' },
          ].map((opt, i) => (
            <TouchableOpacity key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: i < 3 ? 1 : 0, borderBottomColor: T.border }}>
              <Text style={{ fontSize: 20, marginRight: 14 }}>{opt.emoji}</Text>
              <Text style={{ flex: 1, fontWeight: '500', color: T.dark, fontSize: 14 }}>{opt.label}</Text>
              <Text style={{ color: T.muted, fontSize: 18 }}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[S.caption, { textAlign: 'center', marginBottom: 16 }]}>SwachhMitra v2.0.0 · Made with 🌱</Text>
        <TouchableOpacity onPress={handleLogout} style={S.btnDanger}><Text style={S.btnText}>Log Out</Text></TouchableOpacity>
        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
};

// ── HOME SCREENS ──────────────────────────────────────────────────────────────

const VolunteerHome = ({ userData }) => (
  <View style={{ flex: 1, backgroundColor: T.bg }}>
    <View style={{ backgroundColor: T.primary, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 30, paddingHorizontal: 24 }}>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '700' }}>Good morning 🌞</Text>
      <Text style={{ color: T.white, fontSize: 26, fontWeight: '800', marginTop: 2 }}>{userData?.name || 'Volunteer'}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>🌿 Level {userData?.level || 1} · {userData?.location || 'Mumbai'}</Text>
    </View>
    <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20 }}>
      <View style={[S.card, { borderLeftWidth: 4, borderLeftColor: T.primary }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
          <View style={S.avatar}><Text style={S.avatarText}>{(userData?.name || 'V').charAt(0).toUpperCase()}</Text></View>
          <View style={{ marginLeft: 14 }}>
            <Text style={S.h3}>{userData?.name}</Text>
            <Text style={{ color: T.muted, fontSize: 13 }}>🏅 {userData?.xp || 0} XP · {userData?.badges?.length || 0} Badges</Text>
          </View>
        </View>
        <XPBar xp={userData?.xp || 0} level={userData?.level || 1} />
        <View style={{ flexDirection: 'row', marginTop: 14 }}>
          <View style={[S.chip, { backgroundColor: '#E8F5E9' }]}><Text style={{ color: T.primary, fontWeight: '700', fontSize: 12 }}>🏆 {userData?.badges?.length || 0} Badges</Text></View>
          <View style={[S.chip, { backgroundColor: '#E0F7FA' }]}><Text style={{ color: T.accent, fontWeight: '700', fontSize: 12 }}>📸 {userData?.totalScans || 0} Scans</Text></View>
        </View>
      </View>
      <Text style={[S.label, { marginBottom: 14 }]}>Your Impact</Text>
      <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: 20 }}>
        <StatBox emoji="🗓️" value={String(userData?.totalEventsJoined    || 0)} label="Events Joined" />
        <StatBox emoji="♻️" value={String(userData?.totalScans            || 0)} label="Items Scanned" />
        <StatBox emoji="🌍" value={`${(userData?.co2SavedTons || 0).toFixed(1)}t`} label="CO₂ Saved" />
      </View>
      <Text style={[S.label, { marginBottom: 14 }]}>Quick Actions</Text>
      <View style={{ flexDirection: 'row', marginHorizontal: -6, marginBottom: 24 }}>
        {[
          { emoji: '🗓️', title: 'Find Events', subtitle: 'Join a drive near you',  color: T.primary },
          { emoji: '📸', title: 'Scan Waste',  subtitle: 'Classify & earn XP',     color: T.accent },
        ].map(a => (
          <View key={a.title} style={{ flex: 1, marginHorizontal: 6 }}>
            <View style={{ backgroundColor: a.color, borderRadius: 18, padding: 20, alignItems: 'center', shadowColor: a.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, elevation: 6 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>{a.emoji}</Text>
              <Text style={{ color: T.white, fontWeight: '700', fontSize: 14 }}>{a.title}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, textAlign: 'center', marginTop: 3 }}>{a.subtitle}</Text>
            </View>
          </View>
        ))}
      </View>
      <View style={{ height: 20 }} />
    </ScrollView>
  </View>
);

const OrganiserHome = ({ userData }) => (
  <View style={{ flex: 1, backgroundColor: T.bg }}>
    <View style={{ backgroundColor: T.accent, paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 30, paddingHorizontal: 24 }}>
      <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>Welcome back 👋</Text>
      <Text style={{ color: T.white, fontSize: 26, fontWeight: '800', marginTop: 2 }}>{userData?.name}</Text>
      <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>📋 Event Organiser · {userData?.location}</Text>
    </View>
    <ScrollView contentContainerStyle={{ padding: 20 }}>
      <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: 20 }}>
        <StatBox emoji="🗓️" value={String(userData?.eventsCreated || 0)}           label={'Events\nCreated'} />
        <StatBox emoji="👥" value={String(userData?.totalVolunteersManaged || 0)}  label={'Volunteers\nManaged'} />
        <StatBox emoji="⭐" value={String(userData?.avgEventRating || 0)}          label={'Avg\nRating'} />
      </View>
    </ScrollView>
  </View>
);

const CSRHome = ({ userData }) => {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    axios.get(`${BASE_URL}/users/csr-stats/${userData.firebaseUid}`)
      .then(r => setStats(r.data)).catch(() => {});
  }, []);
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <View style={{ backgroundColor: '#4527A0', paddingTop: Platform.OS === 'ios' ? 54 : 34, paddingBottom: 30, paddingHorizontal: 24 }}>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>Good to see you 🤝</Text>
        <Text style={{ color: T.white, fontSize: 26, fontWeight: '800', marginTop: 2 }}>{userData?.name}</Text>
        <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>🏢 CSR Partner · {userData?.location}</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 20 }}>
        <View style={{ flexDirection: 'row', marginHorizontal: -4, marginBottom: 20 }}>
          <StatBox emoji="💰" value={stats ? `₹${(stats.totalFunded/100000).toFixed(1)}L` : '—'} label={'Total\nFunded'} />
          <StatBox emoji="🗓️" value={stats ? String(stats.eventsSponsored?.length || 0) : '—'} label={'Events\nSponsored'} />
          <StatBox emoji="🌍" value={stats ? `${(stats.co2OffsetTons || 0).toFixed(1)}t` : '—'} label={'CO₂\nOffset'} />
        </View>
        <View style={[S.card, { borderLeftWidth: 4, borderLeftColor: '#4527A0' }]}>
          <Text style={[S.h3, { marginBottom: 12 }]}>Impact This Quarter</Text>
          {[
            { label: 'Trees Planted',       value: stats?.treesPlanted || 0 },
            { label: 'Events Sponsored',    value: stats?.eventsSponsored?.length || 0 },
            { label: 'Total Funded (₹)',    value: stats?.totalFunded || 0 },
          ].map((item, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: i < 2 ? 1 : 0, borderBottomColor: T.border }}>
              <Text style={S.body}>{item.label}</Text>
              <Text style={{ fontWeight: '800', color: T.dark, fontSize: 16 }}>{item.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

// ── CHAT ──────────────────────────────────────────────────────────────────────

const ChatListView = ({ userData, onSelectChat }) => {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading]   = useState(true);
  useEffect(() => {
    const targetRole = userData.role === 'organiser' ? 'csr' : 'organiser';
    axios.get(`${BACKEND_URL}/api/users/list-by-role/${targetRole}`)
      .then(r => setPartners(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);
  if (loading) return <View style={S.fullCenter}><ActivityIndicator color={T.primary} /></View>;
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title="Messages" subtitle="Connect with partners" />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {partners.length === 0 && <View style={{ alignItems: 'center', padding: 40 }}><Text style={{ fontSize: 56 }}>💬</Text><Text style={[S.h3, { marginTop: 12 }]}>No Contacts Yet</Text></View>}
        {partners.map(p => {
          const prefix      = p.role === 'csr' ? 'CSR' : 'ORG';
          const displayName = `${prefix}–${p.name}`;
          return (
            <TouchableOpacity key={p.firebaseUid}
              onPress={() => onSelectChat({ id: [userData.firebaseUid, p.firebaseUid].sort().join('_'), name: displayName })}
              style={[S.card, { flexDirection: 'row', alignItems: 'center', padding: 16 }]}>
              <View style={[S.avatar, { backgroundColor: p.role === 'csr' ? '#4527A0' : T.accent }]}>
                <Text style={S.avatarText}>{p.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[S.h3, { fontSize: 15 }]}>{displayName}</Text>
                <Text style={S.caption}>Tap to start conversation</Text>
              </View>
              <Text style={{ color: T.muted, fontSize: 22 }}>›</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const ChatScreen = ({ userData, conversationId, recipientName, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(true);
  const scrollRef = useRef(null);
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/messages/${conversationId}`)
      .then(r => setMessages(r.data)).catch(() => {}).finally(() => setLoading(false));
    socket.emit('joinRoom', { conversationId });
    socket.on('newMessage', msg => setMessages(prev => [...prev, msg]));
    return () => socket.off('newMessage');
  }, [conversationId]);
  const sendMessage = () => {
    if (input.trim()) {
      socket.emit('sendMessage', { conversationId, senderId: userData.firebaseUid, senderName: userData.name, text: input });
      setInput('');
    }
  };
  const isMe = id => id === userData.firebaseUid;
  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <GreenHeader title={recipientName} onBack={onBack} />
      {loading ? <View style={S.fullCenter}><ActivityIndicator color={T.primary} /></View> : (
        <ScrollView ref={scrollRef} style={{ flex: 1, padding: 16 }}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
          {messages.map((msg, i) => (
            <View key={i} style={{ alignSelf: isMe(msg.senderId) ? 'flex-end' : 'flex-start', maxWidth: '80%', marginBottom: 10 }}>
              {!isMe(msg.senderId) && <Text style={{ fontSize: 11, color: T.muted, marginBottom: 4, marginLeft: 4 }}>{msg.senderName}</Text>}
              <View style={{ backgroundColor: isMe(msg.senderId) ? T.primary : T.card, padding: 12, borderRadius: 18,
                borderBottomRightRadius: isMe(msg.senderId) ? 4 : 18, borderBottomLeftRadius: isMe(msg.senderId) ? 18 : 4,
                shadowColor: T.dark, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, elevation: 2 }}>
                <Text style={{ color: isMe(msg.senderId) ? T.white : T.dark, fontSize: 14 }}>{msg.text}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 16 }} />
        </ScrollView>
      )}
      <View style={{ flexDirection: 'row', padding: 12, backgroundColor: T.card, borderTopWidth: 1, borderTopColor: T.border, paddingBottom: Platform.OS === 'ios' ? 28 : 12 }}>
        <TextInput style={{ flex: 1, backgroundColor: T.bg, borderRadius: 24, paddingHorizontal: 18, paddingVertical: 10, fontSize: 14, color: T.dark }}
          value={input} onChangeText={setInput} placeholder="Type a message…" placeholderTextColor={T.muted} multiline />
        <TouchableOpacity onPress={sendMessage} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: T.primary, justifyContent: 'center', alignItems: 'center', marginLeft: 10, alignSelf: 'flex-end' }}>
          <Text style={{ color: T.white, fontSize: 18 }}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ── DASHBOARDS ────────────────────────────────────────────────────────────────

const VolunteerDashboard = ({ userData, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [events, setEvents]       = useState([]);
  const [evLoading, setEvLoading] = useState(false);
  const [geofenceEvent, setGeofenceEvent] = useState(null);

  const fetchEvents = async () => {
    setEvLoading(true);
    try { const r = await axios.get(`${BACKEND_URL}/api/events/all`); setEvents(r.data); } catch {}
    finally { setEvLoading(false); }
  };
  useEffect(() => { if (activeTab === 'Events') fetchEvents(); }, [activeTab]);

  const handleRegister = async (id) => {
    const orig = [...events];
    setEvents(prev => prev.map(ev => ev._id === id ? { ...ev, participants: [...(ev.participants || []), userData.firebaseUid] } : ev));
    try { await axios.post(`${BASE_URL}/events/join`, { eventId: id, firebaseUid: userData.firebaseUid }); }
    catch { setEvents(orig); Alert.alert('Error', 'Could not join event.'); }
  };
  const handleLeave = async (id) => {
    try {
      await axios.post(`${BASE_URL}/events/leave`, { eventId: id, firebaseUid: userData.firebaseUid });
      setEvents(prev => prev.map(ev => ev._id === id ? { ...ev, participants: ev.participants.filter(p => p !== userData.firebaseUid) } : ev));
    } catch { Alert.alert('Error', 'Could not leave event.'); }
  };

  if (geofenceEvent) {
    return (
      <EventGeofenceScreen
        ev={geofenceEvent}
        userData={userData}
        onBack={() => setGeofenceEvent(null)}
      />
    );
  }

  const tabs = ['Home', 'Events', 'Classify', 'Rewards', 'Reports', 'Settings'];
  const renderContent = () => {
    switch (activeTab) {
      case 'Home':     return <VolunteerHome userData={userData} />;
      case 'Events':   return <EventsScreen userData={userData} events={events} loading={evLoading} onRegister={handleRegister} onLeave={handleLeave} onOpenGeofence={setGeofenceEvent} />;
      case 'Classify': return <ClassifyScreen userData={userData} />;
      case 'Rewards':  return <RewardsScreen userData={userData} />;
      case 'Reports':  return <ReportsScreen userData={userData} />;
      case 'Settings': return <SettingsScreen userData={userData} handleLogout={handleLogout} />;
      default: return <View style={S.fullCenter}><Text>Coming soon</Text></View>;
    }
  };
  return (
    <View style={S.flex}>
      <View style={S.flex}>{renderContent()}</View>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
    </View>
  );
};

const OrganiserDashboard = ({ userData, handleLogout, setChatParams }) => {
  const [activeTab, setActiveTab]   = useState('Home');
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);
  if (detailEvent) {
    return (
      <OrganiserEventDetailScreen
        userData={userData}
        ev={detailEvent}
        onBack={() => setDetailEvent(null)}
      />
    );
  }
  if (showAddEvent) return <AddEventForm userData={userData} onBack={() => setShowAddEvent(false)} onSuccess={() => setShowAddEvent(false)} />;
  const tabs = ['Home', 'Events', 'Messages', 'Analytics', 'Settings'];
  const renderContent = () => {
    switch (activeTab) {
      case 'Home':      return <OrganiserHome userData={userData} />;
      case 'Events':    return <MyEventsScreen userData={userData} onAddNew={() => setShowAddEvent(true)} onSelectEvent={setDetailEvent} />;
      case 'Messages':  return <ChatListView userData={userData} onSelectChat={setChatParams} />;
      case 'Analytics': return <AnalyticsScreen userData={userData} />;
      case 'Settings':  return <SettingsScreen userData={userData} handleLogout={handleLogout} />;
      default: return <View style={S.fullCenter}><Text>Coming soon</Text></View>;
    }
  };
  return (
    <View style={S.flex}>
      <View style={S.flex}>{renderContent()}</View>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
    </View>
  );
};

// const CSRDashboard = ({ userData, handleLogout, setChatParams }) => {
//   const [activeTab, setActiveTab] = useState('Home');
//   const tabs = ['Home', 'Reports', 'Messages', 'Rewards', 'Settings'];
//   const renderContent = () => {
//     switch (activeTab) {
//       case 'Home':     return <CSRHome userData={userData} />;
//       case 'Reports':  return <ReportsScreen userData={userData} />;
//       case 'Messages': return <ChatListView userData={userData} onSelectChat={setChatParams} />;
//       case 'Rewards':  return <RewardsScreen userData={userData} />;
//       case 'Settings': return <SettingsScreen userData={userData} handleLogout={handleLogout} />;
//       default: return <View style={S.fullCenter}><Text>Coming soon</Text></View>;
//     }
//   };
//   return (
//     <View style={S.flex}>
//       <View style={S.flex}>{renderContent()}</View>
//       <TabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={tabs} />
//     </View>
//   );
// };
const CSRDashboard = ({ userData, handleLogout, setChatParams }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [allEvents, setAllEvents] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'Reports') {
      axios.get(`${BACKEND_URL}/api/events/all`)
        .then(r => setAllEvents(r.data))
        .catch(e => console.log(e));
    }
  }, [activeTab]);

  const viewReport = async (id) => {
    setLoading(true);
    try {
      const res = await axios.get(`${BASE_URL}/events/report/${id}`);
      setSelectedReport(res.data);
      setShowModal(true);
    } catch {
      Alert.alert("Error", "Could not load report.");
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'Home': return <CSRHome userData={userData} />;
      case 'Messages': return <ChatListView userData={userData} onSelectChat={setChatParams} />;
      case 'Reports': return (
        <ScrollView style={{ flex: 1, padding: 20 }}>
          <Text style={S.h1}>Event Impact Reports</Text>
          <Text style={[S.body, {marginBottom: 20}]}>Verified ESG data for sponsored drives</Text>
          {allEvents.map(ev => (
            <TouchableOpacity key={ev._id} style={S.card} onPress={() => viewReport(ev._id)}>
              <Text style={S.h3}>{ev.name}</Text>
              <Text style={S.caption}>📍 {ev.location} | 📅 {new Date(ev.date).toLocaleDateString()}</Text>
              <Text style={[S.label, {color: T.primary, marginTop: 10}]}>View Full Analytics →</Text>
            </TouchableOpacity>
          ))}
          {loading && <ActivityIndicator color={T.primary} />}
        </ScrollView>
      );
      case 'Settings': return <SettingsScreen userData={userData} handleLogout={handleLogout} />;
      default: return <View style={S.fullCenter}><Text>Coming soon</Text></View>;
    }
  };

  return (
    <View style={S.flex}>
      <View style={S.flex}>{renderContent()}</View>
      
      <Modal visible={showModal} animationType="slide">
        <View style={{ flex: 1, backgroundColor: T.bg }}>
          <GreenHeader title="Impact Report" onBack={() => setShowModal(false)} bgColor="#4527A0" />
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            {selectedReport && (
              <View style={S.card}>
                <Text style={S.h2}>{selectedReport.eventTitle}</Text>
                <Text style={S.caption}>Region: {selectedReport.region}</Text>
                
                <View style={S.divider} />
                <Text style={S.label}>Participation (Verified via GPS)</Text>
                <StatBox emoji="👥" value={selectedReport.metrics.verifiedAttendance} label="Present" />
                <Text style={S.body}>Rate: {selectedReport.metrics.attendanceRate}</Text>
                
                <View style={S.divider} />
                <Text style={S.label}>Environmental Impact (Stubbed)</Text>
                <Text style={S.h3}>Waste: {selectedReport.metrics.totalWasteCollected}</Text>
                <Text style={S.body}>{selectedReport.esgImpact}</Text>
                
                <View style={S.divider} />
                <Text style={S.label}>CSR Financial Summary</Text>
                <Text style={S.body}>Funds Used: {selectedReport.financials.fundUsed}</Text>
                
                <TouchableOpacity style={[S.btnPrimary, {marginTop: 25}]} onPress={() => Alert.alert("Download", "PDF generated and saved.")}>
                  <Text style={S.btnText}>⬇️ Download ESG PDF</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} tabs={['Home', 'Reports', 'Messages', 'Settings']} />
    </View>
  );
};




// ── MAIN APP ──────────────────────────────────────────────────────────────────

export default function AppLogic() {
  const [screen, setScreen]           = useState('welcome');
  const [selectedRole, setSelectedRole] = useState(null);
  const [userData, setUserData]       = useState(null);
  const [chatParams, setChatParams]   = useState(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (user && !userData && screen !== 'register') {
        try {
          const res = await axios.get(`${BACKEND_URL}/api/users/role/${user.uid}`);
          setUserData({ ...res.data, firebaseUid: user.uid, email: user.email });
          setScreen('dashboard');
        } catch {}
      } else if (!user) {
        setUserData(null);
        if (screen === 'dashboard') setScreen('welcome');
      }
    });
    return unsub;
  }, [userData, screen]);

  const renderScreen = () => {
    if (chatParams && userData)
      return <ChatScreen userData={userData} conversationId={chatParams.id} recipientName={chatParams.name} onBack={() => setChatParams(null)} />;
    if (screen === 'dashboard' && userData) {
      const role = userData.role?.toLowerCase();
      if (role === 'volunteer') return <VolunteerDashboard userData={userData} handleLogout={() => signOut(auth)} />;
      if (role === 'organiser') return <OrganiserDashboard userData={userData} handleLogout={() => signOut(auth)} setChatParams={setChatParams} />;
      if (role === 'csr')       return <CSRDashboard userData={userData} handleLogout={() => signOut(auth)} setChatParams={setChatParams} />;
    }
    if (screen === 'register') return <RegisterScreen role={selectedRole} setScreen={setScreen} setRole={setSelectedRole} setUserData={setUserData} />;
    if (screen === 'login')    return <LoginScreen setScreen={setScreen} setUserData={setUserData} />;
    return <WelcomeScreen setRole={setSelectedRole} setIsRegistering={() => setScreen('register')} setIsLoggedIn={() => setScreen('login')} />;
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}