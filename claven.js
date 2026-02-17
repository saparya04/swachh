
import React, { useState, useEffect } from 'react';
import io from "socket.io-client";

import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView, Platform, Image } from 'react-native';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  initializeAuth,
  getReactNativePersistence,
    browserLocalPersistence // <-- Import for Web persistence
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
// Removed: import VolunteerDashboard from './VolunteerDashboard'; (as requested)



// --- BACKEND URL (Updated to your latest URL) ---
const socket = io('http://192.168.0.194:5000'); // e.g. http://192.168.1.5:5000

const BACKEND_URL = 'http://192.168.0.194:5000';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Use different persistence based on environment (Web vs. Native)
const getPersistenceMethod = () => {
    if (Platform.OS === 'web') {
        return browserLocalPersistence;
    }
    return getReactNativePersistence(AsyncStorage);
};

const auth = initializeAuth(app, { 
    persistence: getPersistenceMethod()
});

// --- STYLING (Combined styles from App.js and VolunteerDashboard.js) ---
const THEME = { green: '#2e7d32', blue: '#00bcd4', white: '#ffffff', gray: '#f3f4f6', darkGray: '#4b5563', lightGray: '#e5e7eb' };
const styles = StyleSheet.create({
  // General Screens
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: THEME.white },
  title: { fontSize: 28, fontWeight: 'bold', color: THEME.green, marginBottom: 8 },
  subtitle: { fontSize: 14, color: THEME.darkGray, marginBottom: 16 },
  input: { width: '100%', padding: 12, marginBottom: 16, borderWidth: 1, borderColor: THEME.lightGray, borderRadius: 10, backgroundColor: THEME.white },
  button: { width: '100%', paddingVertical: 15, borderRadius: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3, elevation: 5 },
  buttonText: { fontSize: 18, fontWeight: '600', color: THEME.white, textTransform: 'uppercase' },
  linkText: { marginTop: 20, color: THEME.blue, textDecorationLine: 'underline', fontSize: 14, fontWeight: '600' },
  welcomeContainer: { flex: 1, backgroundColor: THEME.green, justifyContent: 'center', alignItems: 'center', padding: 24 },
  welcomeHeader: { alignItems: 'center', marginBottom: 50 },
  welcomeTitle: { fontSize: 32, fontWeight: 'bold', color: THEME.white, marginBottom: 4 },
  welcomeSubtitle: { fontSize: 14, color: THEME.white, opacity: 0.8 },
  roleButton: { backgroundColor: THEME.blue, marginBottom: 15 },
  dashboardContainer: { flex: 1, padding: 24, backgroundColor: THEME.gray },
  card: { padding: 20, borderRadius: 16, backgroundColor: THEME.green, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 6, elevation: 8 },
  cardTitle: { fontSize: 24, fontWeight: '600', color: THEME.white, textTransform: 'capitalize', marginBottom: 8 },
  cardText: { color: THEME.white, opacity: 0.9 },
  logoutButton: { backgroundColor: '#ef4444', marginTop: 30 },
  
  // Volunteer Dashboard Specific Styles
  dashboardLayout: { flex: 1, backgroundColor: THEME.gray }, 
  headerContainer: { paddingHorizontal: 24, paddingTop: 60, backgroundColor: THEME.white, borderBottomWidth: 1, borderColor: THEME.lightGray },
  homeTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.darkGray },
  profileCard: { padding: 16, marginVertical: 16, backgroundColor: THEME.white, borderRadius: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 5, flexDirection: 'row', alignItems: 'center' },
  profileImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  name: { fontSize: 18, fontWeight: '600', color: THEME.darkGray },
  badges: { fontSize: 14, color: THEME.green, fontWeight: '500', marginTop: 4 },
  xpContainer: { marginTop: 15, width: '100%' },
  xpTextRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  xpProgress: { height: 10, backgroundColor: THEME.lightGray, borderRadius: 5, width: '100%' },
  xpFill: { height: '100%', backgroundColor: THEME.green, borderRadius: 5, width: '75%' }, 
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 24, marginTop: 20, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.darkGray },
  viewAll: { color: THEME.blue, fontWeight: '500' },
  
  eventCard: { backgroundColor: THEME.white, borderRadius: 16, marginHorizontal: 24, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  eventImage: { width: '100%', height: 150, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  eventContent: { padding: 15 },
  eventTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  eventTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.darkGray, maxWidth: '70%' },
  eventTag: { backgroundColor: THEME.blue, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, color: THEME.white, fontSize: 12, fontWeight: '600' },
  eventDetail: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  detailText: { marginLeft: 8, color: THEME.darkGray },
  eventFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, borderTopWidth: 1, borderTopColor: THEME.lightGray, paddingTop: 10 },
  eventOrganizer: { color: THEME.darkGray, fontWeight: '500' },
  registeredButton: { backgroundColor: THEME.lightGray, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 8 },
  registeredButtonText: { color: THEME.darkGray, fontWeight: '600' },

  // Footer/Tab Bar Styles
  footer: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: THEME.lightGray, backgroundColor: THEME.white, paddingVertical: 10 },
  tabItem: { flex: 1, alignItems: 'center' },
  tabIcon: { fontSize: 24, color: THEME.darkGray, marginBottom: 4 },
  activeTabIcon: { color: THEME.green },
  tabLabel: { fontSize: 10, color: THEME.darkGray },
  activeTabLabel: { color: THEME.green, fontWeight: 'bold' },
});


// --- SCREENS (Authentication & Registration) ---
const WelcomeScreen = ({ setRole, setIsRegistering, setIsLoggedIn }) => (
  <View style={styles.welcomeContainer}>
    <View style={styles.welcomeHeader}>
      <Text style={{ fontSize: 60, marginBottom: 20 }}>🌱</Text>
      <Text style={styles.welcomeTitle}>Welcome to SwachhMitra</Text>
      <Text style={styles.welcomeSubtitle}>Clean Together, Impact Forever</Text>
    </View>
    <View style={{ width: '100%', maxWidth: 350 }}>
      <Text style={[styles.welcomeSubtitle, { textAlign: 'center', marginBottom: 20 }]}>Continue as</Text>
      {['volunteer', 'organiser', 'csr'].map(role => (
        <TouchableOpacity
          key={role}
          onPress={() => { setRole(role); setIsRegistering(true); }}
          style={[styles.button, styles.roleButton]}
        >
          <Text style={styles.buttonText}>{role}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity onPress={() => setIsLoggedIn(true)} style={{ marginTop: 25 }}>
        <Text style={[styles.welcomeSubtitle, { textAlign: 'center', textDecorationLine: 'underline' }]}>Already have an account? Log in</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const RegisterScreen = ({ role, setScreen, setRole, setUserData }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async () => {
    setError(null);
    setLoading(true);
    if (!name || !email || !password || !location) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // ✅ CORRECTED API PATH for Registration
      const response = await axios.post(`${BACKEND_URL}/api/users/register-data`, {
        firebaseUid: user.uid,
        name,
        email,
        role,
        location
      });
      setUserData(response.data.user);
      setScreen('dashboard');
    } catch (err) {
      let msg = err.message;
      if (err.code) msg = `Firebase Error: ${err.code.split('/')[1]}`;
      else if (err.response?.data?.message) msg = `Backend Error: ${err.response.data.message}`;
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
    <Text style={[styles.title, { color: '#4f46e5' }]}>Register as {role.toUpperCase()}</Text>
      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
      <TextInput placeholder="Full Name" value={name} onChangeText={setName} style={styles.input} autoCapitalize="words" />
      <TextInput placeholder="Email Address" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TextInput placeholder="Location" value={location} onChangeText={setLocation} style={styles.input} />
      <TouchableOpacity onPress={handleRegister} disabled={loading} style={[styles.button, { backgroundColor: loading ? 'gray' : THEME.green, marginTop: 10 }]}>
        {loading ? <ActivityIndicator color={THEME.white} /> : <Text style={styles.buttonText}>Complete Registration</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => { setScreen('welcome'); setRole(null); }}>
        <Text style={styles.linkText}>Go back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const LoginScreen = ({ setScreen, setUserData }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // ✅ CORRECTED API PATH for Login/Role Fetch
      const response = await axios.get(`${BACKEND_URL}/api/users/role/${user.uid}`);
      setUserData({ ...response.data, firebaseUid: user.uid, email: user.email });
      setScreen('dashboard');
    } catch (err) {
      let msg = err.message;
      if (err.code) msg = `Login Error: ${err.code.split('/')[1]}`;
      else if (err.response?.data?.message) msg = `Data Fetch Error: ${err.response.data.message}`;
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Log In to SwachhMitra</Text>
      {error && <Text style={{ color: 'red', marginBottom: 10 }}>{error}</Text>}
      <TextInput placeholder="Email Address" value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" autoCapitalize="none" />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TouchableOpacity onPress={handleLogin} disabled={loading} style={[styles.button, { backgroundColor: loading ? 'gray' : THEME.blue, marginTop: 10 }]}>
        {loading ? <ActivityIndicator color={THEME.white} /> : <Text style={styles.buttonText}>Log In</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setScreen('welcome')}>
        <Text style={styles.linkText}>Go back to Welcome</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- VOLUNTEER DASHBOARD COMPONENTS ---

// Simple Icon component using Emojis for cross-platform compatibility
const Icon = ({ name, active }) => {
    let emoji;
    let iconStyle = active ? styles.activeTabIcon : styles.tabIcon;
    let notification = false;

    switch (name) {
        case 'Home': emoji = '🏠'; break;
        case 'Events': emoji = '🗓️'; break;
        case 'Classify': emoji = '📸'; break;
        case 'Rewards': emoji = '🏆'; break;
        case 'Settings': emoji = '⚙️'; notification = true; break; // Added Notification for Settings
        case 'Reports': emoji = '📈'; break;
        default: emoji = '?';
    }
    
    return (
        <View>
            <Text style={[styles.tabIcon, iconStyle]}>{emoji}</Text>
            {notification && (
                <View style={{ position: 'absolute', top: -4, right: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: 'red', borderWidth: 1, borderColor: THEME.white }} />
            )}
        </View>
    );
};

const TabBar = ({ activeTab, setActiveTab }) => {
    const tabs = ['Home', 'Events', 'Classify', 'Rewards', 'Settings', 'Reports'];
    return (
        <View style={styles.footer}>
            {tabs.map(tab => (
                <TouchableOpacity
                    key={tab}
                    style={styles.tabItem}
                    onPress={() => setActiveTab(tab)}
                >
                    <Icon name={tab} active={activeTab === tab} />
                    <Text style={[styles.tabLabel, activeTab === tab && styles.activeTabLabel]}>{tab}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

const VolunteerDashboard = ({ userData, handleLogout }) => {
    const [activeTab, setActiveTab] = useState('Home');

    // Mock Data for demonstration
    const mockUser = {
        name: userData.name || 'Volunteer', // Use actual name if available
        badges: 2,
        xp: 450,
        profileUri: 'https://placehold.co/60x60/d1d5db/374151?text=VP', 
    };

    const mockEvent = {
        title: 'Juhu Beach Cleanup Drive',
        location: 'Juhu Beach, Mumbai',
        date: '2025-07-10',
        time: '07:00 - 10:00',
        participants: '4/20',
        organizer: 'By Priya Patel',
        tag: 'Beach',
        // --- STABLE JPG URL FOR BEACH IMAGE ---
        // Using a publicly available .jpg image for the event card
        imageUri: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2673&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', 
    };

    // Render different content based on activeTab 
    const renderContent = () => {
        if (activeTab === 'Settings') {
             return (
                 <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'flex-start', alignItems: 'center' }}>
                     <Text style={[styles.sectionTitle, { marginBottom: 30, marginTop: 20, fontSize: 24 }]}>Settings & Account</Text>
                     
                     <View style={{ width: '100%', maxWidth: 400, backgroundColor: THEME.white, padding: 15, borderRadius: 12, marginBottom: 20 }}>
                        <Text style={styles.name}>User Email:</Text>
                        <Text style={styles.detailText}>{userData.email || 'N/A'}</Text>
                     </View>

                     <TouchableOpacity onPress={handleLogout} style={{ width: '100%', maxWidth: 400, backgroundColor: '#ef4444', padding: 15, borderRadius: 12, alignItems: 'center', marginVertical: 10 }}>
                       <Text style={{ color: THEME.white, fontWeight: 'bold' }}>Log Out</Text>
                     </TouchableOpacity>
                 </ScrollView>
             );
        }

        if (activeTab !== 'Home') {
            return (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <Text style={styles.sectionTitle}>The {activeTab} screen is coming soon!</Text>
                </View>
            );
        }

        // Home Tab Content (Default)
        return (
            <ScrollView style={{ flex: 1 }}>
                <View style={styles.headerContainer}>
                    <Text style={styles.homeTitle}>Home</Text>
                </View>
                
                {/* Profile Card */}
                <View style={{ paddingHorizontal: 24 }}>
                    <View style={styles.profileCard}>
                        <Image source={{ uri: mockUser.profileUri }} style={styles.profileImage} /> 
                        <View style={{ flex: 1 }}>
                            <Text style={styles.name}>{mockUser.name}</Text>
                            <Text style={styles.badges}>🏅 {mockUser.badges} Badges</Text>
                            <View style={styles.xpContainer}>
                                <View style={styles.xpTextRow}>
                                    <Text style={{ color: THEME.darkGray }}>XP Progress</Text>
                                    <Text style={{ color: THEME.green, fontWeight: 'bold' }}>{mockUser.xp} XP</Text>
                                </View>
                                <View style={styles.xpProgress}>
                                    {/* XP progress calculated relative to a max (e.g., 1000 XP) */}
                                    <View style={[styles.xpFill, { width: `${Math.min(100, (mockUser.xp / 1000) * 100)}%` }]} /> 
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Upcoming Events Section */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Upcoming Events</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAll}>View All</Text>
                    </TouchableOpacity>
                </View>

                {/* Event Card */}
                <View style={styles.eventCard}>
                    {/* Image Component with fixed dimensions and error handling */}
                    <Image 
                        source={{ uri: mockEvent.imageUri }} 
                        style={styles.eventImage}
                        // Logs to console if image fails to load (due to URL, network, etc.)
                        onError={({ nativeEvent: { error } }) => console.error('Image load failed:', error)}
                    />
                    <View style={styles.eventContent}>
                        <View style={styles.eventTitleRow}>
                            <Text style={styles.eventTitle}>{mockEvent.title}</Text>
                            <Text style={styles.eventTag}>{mockEvent.tag}</Text>
                        </View>
                        
                        <View style={styles.eventDetail}>
                            <Text style={{ fontSize: 18 }}>📍</Text>
                            <Text style={styles.detailText}>{mockEvent.location}</Text>
                        </View>
                        <View style={styles.eventDetail}>
                            <Text style={{ fontSize: 18 }}>📅</Text>
                            <Text style={styles.detailText}>{mockEvent.date}</Text>
                            <Text style={{ marginLeft: 15, fontSize: 18 }}>⏰</Text>
                            <Text style={styles.detailText}>{mockEvent.time}</Text>
                        </View>
                        <View style={styles.eventDetail}>
                            <Text style={{ fontSize: 18 }}>👥</Text>
                            <Text style={styles.detailText}>{mockEvent.participants} participants</Text>
                        </View>

                        <View style={styles.eventFooter}>
                            <Text style={styles.eventOrganizer}>{mockEvent.organizer}</Text>
                            <TouchableOpacity style={styles.registeredButton}>
                                <Text style={styles.registeredButtonText}>Registered</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Placeholder for more content to fill the screen */}
                <View style={{ height: 100 }} />
            </ScrollView>
        );
    };

    return (
        <View style={styles.dashboardLayout}>
            {renderContent()}
            <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
        </View>
    );
}

const CSRDashboard = ({ userData, handleLogout }) => {
  const [csrData, setCsrData] = useState({
    eventsSponsored: 0,
    volunteerHours: 0,
    segregationRate: 82,
  });

  const [activeTab, setActiveTab] = useState('Home');

  const handleFindEvents = () => {
    Alert.alert("Find Events", "This feature is coming soon!");
  };

  const renderContent = () => {
    if (activeTab !== 'Home') {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontWeight: '600' }}>
            The {activeTab} screen is coming soon!
          </Text>
        </View>
      );
    }

    return (
      <ScrollView
        style={{ flex: 1, backgroundColor: '#fff' }}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Header */}
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
          Home
        </Text>

        {/* Profile Card */}
        <View
          style={{
            backgroundColor: '#e6f4ea',
            borderRadius: 12,
            padding: 16,
            marginBottom: 16,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              backgroundColor: '#2e7d32',
              width: 48,
              height: 48,
              borderRadius: 24,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
              {userData?.name?.charAt(0)?.toUpperCase() || 'C'}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              {userData?.name || 'CSR Partner'}
            </Text>
            <Text style={{ color: '#2e7d32' }}>CSR Partner</Text>
          </View>
        </View>

        {/* CSR Impact Section */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            elevation: 2,
            marginBottom: 20,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>
            Your CSR Impact
          </Text>
          <View style={{ marginBottom: 10 }}>
            <Text>📅 Events Sponsored</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              {csrData.eventsSponsored}
            </Text>
          </View>
          <View style={{ marginBottom: 10 }}>
            <Text>⏱️ Volunteer Hours</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              {csrData.volunteerHours}
            </Text>
          </View>
          <View>
            <Text>♻️ Segregation Rate</Text>
            <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
              {csrData.segregationRate}%
            </Text>
          </View>
        </View>

        {/* Sponsored Events Section */}
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 16,
            elevation: 2,
            borderWidth: 1,
            borderColor: '#e5e7eb',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              Sponsored Events
            </Text>
            <TouchableOpacity onPress={handleFindEvents}>
              <Text style={{ color: '#2e7d32', fontWeight: '600' }}>
                Find Events
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={{ color: '#6b7280', marginBottom: 12 }}>
            You haven't sponsored any events yet
          </Text>
          <TouchableOpacity
            onPress={handleFindEvents}
            style={{
              backgroundColor: '#2e7d32',
              paddingVertical: 12,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Find Events</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleLogout}
          style={{
            backgroundColor: '#ef4444',
            paddingVertical: 12,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 30,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderContent()}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};





// --- MAIN Organizer DASHBOARD SCREEN (Routes to the specific role dashboard) ---
const OrganiserDashboard = ({ userData, handleLogout }) => {
  const [activeTab, setActiveTab] = useState('Home');
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [eventData, setEventData] = useState({
    name: '',
    date: '',
    time: '',
    volunteers: '',
    location: ''
  });
  const [loading, setLoading] = useState(false);
  const [allEvents, setAllEvents] = useState([]); // Stores all events
  const [successMessage, setSuccessMessage] = useState(''); // Temporary message


  const organiser = {
    name: userData.name || 'Organizer',
    role: 'Event Organizer',
    impact: {
      events: 0,
      volunteers: 0,
      wasteBags: 24,
      segregation: 78,
    },
  };

  const handleInputChange = (key, value) => {
    setEventData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmitEvent = async () => {
  if (!eventData.name || !eventData.date || !eventData.time || !eventData.volunteers || !eventData.location) {
    Alert.alert('Error', 'Please fill all fields.');
    return;
  }

  setLoading(true);
  try {
    await axios.post(`${BACKEND_URL}/api/events/create`, {
      organiserUid: userData.firebaseUid,
      name: eventData.name,
      date: eventData.date,
      time: eventData.time,
      volunteersRequired: Number(eventData.volunteers),
      location: eventData.location
    });

    setSuccessMessage('Event created successfully!'); // ✅ Step 3
    setEventData({ name: '', date: '', time: '', volunteers: '', location: '' }); // ✅ Step 4
  } catch (err) {
    console.error(err);
    Alert.alert('Error', 'Failed to create event.');
  } finally {
    setLoading(false);
  }
};



  const renderContent = () => {
    if (activeTab === 'Events') {
      if (!showAddEventForm) {
        return (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Your Events</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#2e7d32', padding: 15, borderRadius: 10 }}
              onPress={() => setShowAddEventForm(true)}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Add an Event</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20 }}>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Add Event</Text>

          <TextInput
            placeholder="Event Name"
            value={eventData.name}
            onChangeText={text => handleInputChange('name', text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Date (YYYY-MM-DD)"
            value={eventData.date}
            onChangeText={text => handleInputChange('date', text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Time (HH:MM)"
            value={eventData.time}
            onChangeText={text => handleInputChange('time', text)}
            style={styles.input}
          />
          <TextInput
            placeholder="Number of Volunteers"
            value={eventData.volunteers}
            onChangeText={text => handleInputChange('volunteers', text)}
            style={styles.input}
            keyboardType="numeric"
          />
          <TextInput
            placeholder="Location"
            value={eventData.location}
            onChangeText={text => handleInputChange('location', text)}
            style={styles.input}
          />

          <TouchableOpacity
            onPress={handleSubmitEvent}
            style={[styles.button, { backgroundColor: loading ? 'gray' : '#2e7d32', marginTop: 10 }]}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Submitting...' : 'Submit'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowAddEventForm(false)}
            style={{ marginTop: 20 }}
          >
            <Text style={styles.linkText}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      );
    }

    if (activeTab !== 'Home') {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={styles.sectionTitle}>The {activeTab} screen is coming soon!</Text>
        </View>
      );
    }

    // Home Tab Content
    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
        {/* Header */}
        <View style={[styles.headerContainer, { borderBottomWidth: 0 }]}>
          <Text style={styles.homeTitle}>Home</Text>
        </View>

        {/* Profile */}
        <View style={{ alignItems: 'center', marginVertical: 20 }}>
          <View style={{ 
            width: 80, height: 80, borderRadius: 40, 
            backgroundColor: '#2e7d32', 
            justifyContent: 'center', alignItems: 'center' 
          }}>
            <Text style={{ color: 'white', fontSize: 28, fontWeight: 'bold' }}>
              {organiser.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: '600', marginTop: 10 }}>
            {organiser.name.toLowerCase()}
          </Text>
          <Text style={{ color: '#16a34a', fontWeight: '500' }}>
            {organiser.role}
          </Text>
        </View>

        {/* Impact Section */}
        <View style={{
          backgroundColor: 'white',
          marginHorizontal: 20,
          borderRadius: 16,
          padding: 20,
          shadowColor: '#000',
          shadowOpacity: 0.1,
          shadowRadius: 6,
          elevation: 4,
        }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Your Impact</Text>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{organiser.impact.events}</Text>
              <Text style={{ color: '#6b7280' }}>Events Created</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{organiser.impact.volunteers}</Text>
              <Text style={{ color: '#6b7280' }}>Volunteers</Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{organiser.impact.wasteBags}</Text>
              <Text style={{ color: '#6b7280' }}>Waste Bags</Text>
            </View>
            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: 'bold' }}>{organiser.impact.segregation}%</Text>
              <Text style={{ color: '#6b7280' }}>Avg. Segregation</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleLogout} 
          style={{
            backgroundColor: '#ef4444',
            margin: 30,
            padding: 15,
            borderRadius: 10,
            alignItems: 'center'
          }}>
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      {renderContent()}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};


const DashboardScreen = ({ userData, setScreen, setUserData }) => {
  // Use the 'auth' object from the outer scope to perform logout
  const handleLogout = async () => {
    try { 
        await signOut(auth); 
        setUserData(null); 
        setScreen('welcome'); 
    }
    catch (err) { 
        Alert.alert('Logout Failed', 'Could not log out due to an error.'); 
    }
  };
    
  // Conditional rendering based on user role
  const userRole = userData.role ? userData.role.toLowerCase() : null;

  if (userRole === 'volunteer') {
      // THIS NOW CALLS THE LOCAL VolunteerDashboard component
      return <VolunteerDashboard userData={userData} handleLogout={handleLogout} />;
  }
if (userRole === 'organiser') {
    return <OrganiserDashboard userData={userData} handleLogout={handleLogout} />;
}
if (userRole === 'csr') {
  return <CSRDashboard userData={userData} handleLogout={handleLogout} />;
}


  
  // Default/Simple Dashboard for other roles (Organiser/CSR)
  return (
    <ScrollView contentContainerStyle={styles.dashboardContainer}>
      <Text style={[styles.title, { fontSize: 32, color: THEME.green }]}>Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, {userData.name}!</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Hello {userData.role}!</Text>
        <Text style={styles.cardText}>This is your personalized dashboard for {userData.role} activities.</Text>
      </View>
      <TouchableOpacity onPress={handleLogout} style={[styles.button, styles.logoutButton]}>
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- MAIN APP LOGIC ---
export default function AppLogic() {
  const [screen, setScreen] = useState('welcome');
  const [selectedRole, setSelectedRole] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && !userData) {
        try {
          // Corrected Backend Endpoint
          const response = await axios.get(`${BACKEND_URL}/api/users/role/${user.uid}`);
          const name = response.data.name || user.email.split('@')[0];
          setUserData({ ...response.data, name: name, firebaseUid: user.uid, email: user.email });
          setScreen('dashboard');
        } catch (err) {
          console.error('Failed to fetch user role:', err);
          // Only show the welcome screen if the user is completely new (not in MongoDB)
          setScreen('welcome'); 
        }
      } else if (!user) {
        setUserData(null);
        if (!['register', 'login'].includes(screen)) setScreen('welcome');
      }
    });
    return unsubscribe;
  }, [userData, screen]);

  const renderScreen = () => {
    if (screen === 'dashboard' && userData) return <DashboardScreen userData={userData} setScreen={setScreen} setUserData={setUserData} />;
    if (screen === 'register' && selectedRole) return <RegisterScreen role={selectedRole} setScreen={setScreen} setRole={setSelectedRole} setUserData={setUserData} />;
    if (screen === 'login') return <LoginScreen setScreen={setScreen} setUserData={setUserData} />;
    return <WelcomeScreen setRole={setSelectedRole} setIsRegistering={() => setScreen('register')} setIsLoggedIn={() => setScreen('login')} />;
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}
