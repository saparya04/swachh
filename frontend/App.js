import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  getReactNativePersistence,
  initializeAuth,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
// import { Platform, Linking } from 'react-native';

// --- CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCTL_q0pfcj0Ut0_20MnR8GThLi9kc5U-E",
  authDomain: "th-year-e940d.firebaseapp.com",
  projectId: "th-year-e940d",
  storageBucket: "th-year-e940d.firebasestorage.app",
  messagingSenderId: "1056026710715",
  appId: "1:1056026710715:web:fbbdc5b70277c29bed8f9e",
  measurementId: "G-2VPF0FER2N",
};

const BACKEND_URL = "http://192.168.0.196:5000"; // Ensure this matches your IPv4

const app = initializeApp(firebaseConfig);
const getPersistenceMethod = () =>
  Platform.OS === "web"
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage);
const auth = initializeAuth(app, { persistence: getPersistenceMethod() });

const THEME = {
  green: "#2e7d32",
  blue: "#00bcd4",
  white: "#ffffff",
  gray: "#f3f4f6",
  darkGray: "#4b5563",
  lightGray: "#e5e7eb",
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: THEME.white,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: THEME.green,
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: THEME.darkGray, marginBottom: 16 },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: THEME.lightGray,
    borderRadius: 10,
    backgroundColor: THEME.white,
  },
  button: {
    width: "100%",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "600",
    color: THEME.white,
    textTransform: "uppercase",
  },
  linkText: {
    marginTop: 20,
    color: THEME.blue,
    textDecorationLine: "underline",
    fontSize: 14,
    fontWeight: "600",
  },
  welcomeContainer: {
    flex: 1,
    backgroundColor: THEME.green,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  welcomeHeader: { alignItems: "center", marginBottom: 50 },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: THEME.white,
    marginBottom: 4,
  },
  welcomeSubtitle: { fontSize: 14, color: THEME.white, opacity: 0.8 },
  roleButton: { backgroundColor: THEME.blue, marginBottom: 15 },
  dashboardContainer: { flex: 1, padding: 24, backgroundColor: THEME.gray },
  card: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: THEME.green,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: THEME.white,
    textTransform: "capitalize",
    marginBottom: 8,
  },
  cardText: { color: THEME.white, opacity: 0.9 },
  logoutButton: { backgroundColor: "#ef4444", marginTop: 30 },
  dashboardLayout: { flex: 1, backgroundColor: THEME.gray },
  headerContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    backgroundColor: THEME.white,
    borderBottomWidth: 1,
    borderColor: THEME.lightGray,
  },
  homeTitle: { fontSize: 24, fontWeight: "bold", color: THEME.darkGray },
  profileCard: {
    padding: 16,
    marginVertical: 16,
    backgroundColor: THEME.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    flexDirection: "row",
    alignItems: "center",
  },
  profileImage: { width: 60, height: 60, borderRadius: 30, marginRight: 15 },
  name: { fontSize: 18, fontWeight: "600", color: THEME.darkGray },
  badges: { fontSize: 14, color: THEME.green, fontWeight: "500", marginTop: 4 },
  xpContainer: { marginTop: 15, width: "100%" },
  xpTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  xpProgress: {
    height: 10,
    backgroundColor: THEME.lightGray,
    borderRadius: 5,
    width: "100%",
  },
  xpFill: {
    height: "100%",
    backgroundColor: THEME.green,
    borderRadius: 5,
    width: "75%",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: THEME.darkGray },
  viewAll: { color: THEME.blue, fontWeight: "500" },
  eventCard: {
    backgroundColor: THEME.white,
    borderRadius: 16,
    marginHorizontal: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventImage: {
    width: "100%",
    height: 150,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  eventContent: { padding: 15 },
  eventTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: THEME.darkGray,
    maxWidth: "70%",
  },
  eventTag: {
    backgroundColor: THEME.blue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    color: THEME.white,
    fontSize: 12,
    fontWeight: "600",
  },
  eventDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  detailText: { marginLeft: 8, color: THEME.darkGray },
  eventFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: THEME.lightGray,
    paddingTop: 10,
  },
  eventOrganizer: { color: THEME.darkGray, fontWeight: "500" },
  registeredButton: {
    backgroundColor: THEME.lightGray,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
  },
  registeredButtonText: { color: THEME.darkGray, fontWeight: "600" },
  footer: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: THEME.lightGray,
    backgroundColor: THEME.white,
    paddingVertical: 10,
  },
  tabItem: { flex: 1, alignItems: "center" },
  tabIcon: { fontSize: 24, color: THEME.darkGray, marginBottom: 4 },
  activeTabIcon: { color: THEME.green },
  tabLabel: { fontSize: 10, color: THEME.darkGray },
  activeTabLabel: { color: THEME.green, fontWeight: "bold" },
});

// --- HELPER COMPONENTS ---

const Icon = ({ name, active }) => {
  let emoji;
  let iconStyle = active ? styles.activeTabIcon : styles.tabIcon;
  switch (name) {
    case "Home":
      emoji = "🏠";
      break;
    case "Events":
      emoji = "🗓️";
      break;
    case "Classify":
      emoji = "📸";
      break;
    case "Rewards":
      emoji = "🏆";
      break;
    case "Settings":
      emoji = "⚙️";
      break;
    case "Reports":
      emoji = "📈";
      break;
    default:
      emoji = "?";
  }
  return <Text style={[styles.tabIcon, iconStyle]}>{emoji}</Text>;
};

const TabBar = ({ activeTab, setActiveTab }) => {
  const tabs = ["Home", "Events", "Classify", "Rewards", "Settings", "Reports"];
  return (
    <View style={styles.footer}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab}
          style={styles.tabItem}
          onPress={() => setActiveTab(tab)}
        >
          <Icon name={tab} active={activeTab === tab} />
          <Text
            style={[
              styles.tabLabel,
              activeTab === tab && styles.activeTabLabel,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// --- AUTH SCREENS ---

const WelcomeScreen = ({ setRole, setIsRegistering, setIsLoggedIn }) => (
  <View style={styles.welcomeContainer}>
    <View style={styles.welcomeHeader}>
      <Text style={{ fontSize: 60, marginBottom: 20 }}>🌱</Text>
      <Text style={styles.welcomeTitle}>Welcome to SwachhMitra</Text>
      <Text style={styles.welcomeSubtitle}>Clean Together, Impact Forever</Text>
    </View>
    <View style={{ width: "100%", maxWidth: 350 }}>
      <Text
        style={[
          styles.welcomeSubtitle,
          { textAlign: "center", marginBottom: 20 },
        ]}
      >
        Continue as
      </Text>
      {["volunteer", "organiser", "csr"].map((role) => (
        <TouchableOpacity
          key={role}
          onPress={() => {
            setRole(role);
            setIsRegistering(true);
          }}
          style={[styles.button, styles.roleButton]}
        >
          <Text style={styles.buttonText}>{role}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        onPress={() => setIsLoggedIn(true)}
        style={{ marginTop: 25 }}
      >
        <Text
          style={[
            styles.welcomeSubtitle,
            { textAlign: "center", textDecorationLine: "underline" },
          ]}
        >
          Already have an account? Log in
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

const RegisterScreen = ({ role, setScreen, setRole, setUserData }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
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
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      const response = await axios.post(
        `${BACKEND_URL}/api/users/register-data`,
        {
          firebaseUid: user.uid,
          name,
          email,
          role,
          location,
        },
      );
      setUserData(response.data.user);
      setScreen("dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={[styles.title, { color: "#4f46e5" }]}>
        Register as {role.toUpperCase()}
      </Text>
      {error && <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>}
      <TextInput
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
      />
      <TextInput
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <TextInput
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
        style={styles.input}
      />
      <TouchableOpacity
        onPress={handleRegister}
        disabled={loading}
        style={[
          styles.button,
          { backgroundColor: loading ? "gray" : THEME.green, marginTop: 10 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={THEME.white} />
        ) : (
          <Text style={styles.buttonText}>Complete Registration</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => {
          setScreen("welcome");
          setRole(null);
        }}
      >
        <Text style={styles.linkText}>Go back</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const LoginScreen = ({ setScreen, setUserData }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;
      const response = await axios.get(
        `${BACKEND_URL}/api/users/role/${user.uid}`,
      );
      setUserData({
        ...response.data,
        firebaseUid: user.uid,
        email: user.email,
      });
      setScreen("dashboard");
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Log In to SwachhMitra</Text>
      {error && <Text style={{ color: "red", marginBottom: 10 }}>{error}</Text>}
      <TextInput
        placeholder="Email Address"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        style={styles.input}
        secureTextEntry
      />
      <TouchableOpacity
        onPress={handleLogin}
        disabled={loading}
        style={[
          styles.button,
          { backgroundColor: loading ? "gray" : THEME.blue, marginTop: 10 },
        ]}
      >
        {loading ? (
          <ActivityIndicator color={THEME.white} />
        ) : (
          <Text style={styles.buttonText}>Log In</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => setScreen("welcome")}>
        <Text style={styles.linkText}>Go back to Welcome</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// --- VOLUNTEER DASHBOARD ---
// --- UPDATED CLASSIFY SCREEN ---
// const ClassifyScreen = () => {
//   const [showLiveFeed, setShowLiveFeed] = useState(false);

//   // Note: Ensure BACKEND_URL uses port 5001 for Flask (or match your app.py)
//   const FLASK_URL = 'http://192.168.0.100:5001'; // CHANGE TO YOUR IPv4

//   {showLiveFeed ? (
//     <Image
//       source={{ uri: `${FLASK_URL}/video_feed?time=${new Date().getTime()}` }}
//       style={{ width: '100%', height: '100%' }}
//       resizeMode="contain"
//     />
// ) : (
//     <Text style={{ color: '#fff' }}>Camera Preview Inactive</Text>
// )}

//   return (
//     <ScrollView style={{ flex: 1, backgroundColor: THEME.white }}>
//       <View style={styles.container}>
//         <Text style={styles.title}>Waste Classification</Text>
//         <Text style={styles.subtitle}>Dual classification model</Text>

//         {/* Video Stream Container */}
//         <View style={{
//           width: '100%',
//           height: 300,
//           backgroundColor: '#000',
//           borderRadius: 15,
//           overflow: 'hidden',
//           marginVertical: 20,
//           justifyContent: 'center',
//           alignItems: 'center'
//         }}>
//           {showLiveFeed ? (
//             <Image
//               source={{ uri: `${FLASK_URL}/video_feed?time=${new Date().getTime()}` }}
//               style={{ width: '100%', height: '100%' }}
//               resizeMode="contain"
//             />
//           ) : (
//             <Text style={{ color: '#fff' }}>Camera Preview Inactive</Text>
//           )}
//         </View>

//         <TouchableOpacity
//           style={[styles.button, { backgroundColor: showLiveFeed ? '#ef4444' : THEME.green }]}
//           onPress={() => setShowLiveFeed(!showLiveFeed)}
//         >
//           <Text style={styles.buttonText}>
//             {showLiveFeed ? "Stop Detection" : "Primary Classification"}
//           </Text>
//         </TouchableOpacity>

//         <TouchableOpacity
//           style={[styles.button, { backgroundColor: THEME.blue, marginTop: 15 }]}
//           onPress={() => Alert.alert("Coming Soon", "Final model integration in progress.")}
//         >
//           <Text style={styles.buttonText}>Final Classification</Text>
//         </TouchableOpacity>
//       </View>
//     </ScrollView>
//   );
// };

// Change your import at the top of App.js to this:

const ClassifyScreen = ({ isDark }) => {
  const [permission, requestPermission] = useCameraPermissions();
  const [showLiveFeed, setShowLiveFeed] = useState(false);
  const [processedImage, setProcessedImage] = useState(null);
  const [wasteData, setWasteData] = useState({ name: "", type: "" }); // Store both name and category
  const [showFinalModal, setShowFinalModal] = useState(false);

  const cameraRef = React.useRef(null);

  const FLASK_URL = "http://192.168.0.100:5001";

  const runDetection = async () => {
    if (cameraRef.current && showLiveFeed) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          base64: true,
          quality: 0.3,
        });
        const response = await axios.post(`${FLASK_URL}/classify_frame`, {
          image: photo.base64,
        });

        setProcessedImage(`data:image/jpeg;base64,${response.data.image}`);

        // Expected response from Flask: { image: "...", label: "BOTTLE", category: "Dry" }
        if (response.data.label) {
          setWasteData({
            name: response.data.label,
            type: response.data.category || "Scanning...",
          });
        }
      } catch (e) {
        console.log("Detection error");
      }
    }
  };

  useEffect(() => {
    let interval;
    if (showLiveFeed) {
      interval = setInterval(runDetection, 300);
    } else {
      setProcessedImage(null);
      setWasteData({ name: "", type: "" });
    }
    return () => clearInterval(interval);
  }, [showLiveFeed]);

  if (!permission?.granted) {
    return (
      <View style={styles.container}>
        <Text style={[styles.subtitle, isDark && { color: "#fff" }]}>
          Camera permission is required
        </Text>
        <TouchableOpacity
          style={[styles.button, { marginTop: 20 }]}
          onPress={requestPermission}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ flexGrow: 1 }}
      style={{ flex: 1, backgroundColor: isDark ? "#111827" : THEME.white }}
    >
      <View
        style={[
          styles.container,
          {
            justifyContent: showLiveFeed ? "flex-start" : "center",
            paddingTop: showLiveFeed ? 40 : 0,
          },
        ]}
      >
        <Text style={[styles.title, isDark && { color: "#fff" }]}>
          Waste Classification
        </Text>
        {!showLiveFeed && (
          <Text style={[styles.subtitle, isDark && { color: "#9ca3af" }]}>
            Dual classification model
          </Text>
        )}

        {/* 1. CAMERA WINDOW - Only visible when detection starts */}
        {showLiveFeed && (
          <View
            style={{
              width: "100%",
              height: 380,
              backgroundColor: "#000",
              borderRadius: 20,
              overflow: "hidden",
              marginTop: 20,
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 3,
              borderColor: THEME.green,
            }}
          >
            {processedImage ? (
              <Image
                source={{ uri: processedImage }}
                style={{ width: "100%", height: "100%" }}
                resizeMode="cover"
              />
            ) : (
              <CameraView
                ref={cameraRef}
                style={{ width: "100%", height: "100%" }}
                facing="back"
              />
            )}
          </View>
        )}

        {/* 2. DETECTION RESULT - Displayed prominently above the button */}
        {showLiveFeed && (
          <View
            style={{
              width: "100%",
              padding: 20,
              backgroundColor: isDark ? "#1f2937" : "#f0fdf4",
              borderRadius: 15,
              marginVertical: 15,
              alignItems: "center",
              borderWidth: 1,
              borderColor: THEME.green,
            }}
          >
            <Text
              style={{
                color: THEME.green,
                fontSize: 12,
                fontWeight: "bold",
                letterSpacing: 1,
              }}
            >
              CATEGORY
            </Text>
            <Text
              style={{
                color: isDark ? "#fff" : "#111",
                fontSize: 36,
                fontWeight: "900",
                textTransform: "uppercase",
              }}
            >
              {wasteData.type || "Waiting..."}
            </Text>
            <Text style={{ color: THEME.blue, fontSize: 16 }}>
              Item: {wasteData.name || "None"}
            </Text>
          </View>
        )}

        {/* 3. TOGGLE BUTTON */}
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: showLiveFeed ? "#ef4444" : THEME.green,
              marginTop: showLiveFeed ? 0 : 30,
            },
          ]}
          onPress={() => setShowLiveFeed(!showLiveFeed)}
        >
          <Text style={styles.buttonText}>
            {showLiveFeed ? "Stop Camera" : "Primary Classification"}
          </Text>
        </TouchableOpacity>

        {!showLiveFeed && (
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: THEME.blue, marginTop: 15 },
            ]}
            onPress={() => setShowFinalModal(true)} // Open the Hugging Face interface
          >
            <Text style={styles.buttonText}>Final Classification</Text>
          </TouchableOpacity>
        )}

        {/* 4. MODAL FOR HUGGING FACE INTERFACE */}
        <Modal
          visible={showFinalModal}
          animationType="slide"
          onRequestClose={() => setShowFinalModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: THEME.white }}>
            <View
              style={{
                padding: 40,
                borderBottomWidth: 1,
                borderBottomColor: THEME.lightGray,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: "bold" }}>
                Final Waste Check
              </Text>
              <TouchableOpacity onPress={() => setShowFinalModal(false)}>
                <Text style={{ color: "red", fontWeight: "bold" }}>CLOSE</Text>
              </TouchableOpacity>
            </View>
            <WebView
              source={{
                uri: "https://huggingface.co/spaces/vanshkadam/waste-bag-classifier",
              }}
              style={{ flex: 1 }}
              startInLoadingState={true}
              renderLoading={() => (
                <ActivityIndicator
                  size="large"
                  color={THEME.green}
                  style={{ position: "absolute", top: "50%", left: "45%" }}
                />
              )}
            />
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
};

// --- SAME IMPORTS ---
// (no change above)

const VolunteerDashboard = ({ userData, handleLogout }) => {
  const [activeTab, setActiveTab] = useState("Home");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "Events") fetchEvents();
  }, [activeTab]);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/events/all`);
      setEvents(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterEvent = async (eventId) => {
    try {
      await axios.post(`${BACKEND_URL}/api/events/join`, {
        eventId,
        firebaseUid: userData.firebaseUid,
      });
      Alert.alert("Success", "Registered for event!");
      fetchEvents();
    } catch (e) {
      Alert.alert("Error", "Could not register");
    }
  };

  const renderContent = () => {
    if (activeTab === "Classify") {
      return <ClassifyScreen />;
    }

    if (activeTab === "Events") {
      return (
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.headerContainer}>
            <Text style={styles.homeTitle}>Cleanup Events</Text>
          </View>
          {events.map((ev) => (
            <View key={ev._id} style={styles.eventCard}>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80",
                }}
                style={styles.eventImage}
              />
              <View style={styles.eventContent}>
                <Text style={styles.eventTitle}>{ev.name}</Text>
                <Text style={styles.detailText}>📍 {ev.location}</Text>
                <Text style={styles.detailText}>
                  📅 {new Date(ev.date).toDateString()} | ⏰ {ev.time}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.button,
                    { backgroundColor: THEME.green, marginTop: 10 },
                  ]}
                  onPress={() => handleRegisterEvent(ev._id)}
                >
                  <Text style={styles.buttonText}>Register Event</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </ScrollView>
      );
    }

    if (activeTab === "Home") {
      return (
        <ScrollView style={{ flex: 1 }}>
          {/* <View style={styles.headerContainer}>
            <Text style={styles.homeTitle}>Home</Text>
          </View> */}
          <View style={styles.headerContainer}>
            <Text style={styles.homeTitle}>Home</Text>
          </View>
          <View style={{ paddingHorizontal: 24 }}>
            <View style={styles.profileCard}>
              <Image
                source={{
                  uri: "https://placehold.co/60x60/d1d5db/374151?text=VP",
                }}
                style={styles.profileImage}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{userData.name || "Volunteer"}</Text>
                <Text style={styles.badges}>🏅 2 Badges</Text>
                <View style={styles.xpContainer}>
                  <View style={styles.xpTextRow}>
                    <Text>XP Progress</Text>
                    <Text>450 XP</Text>
                  </View>
                  <View style={styles.xpProgress}>
                    <View style={[styles.xpFill, { width: "45%" }]} />
                  </View>
                </View>
              </View>
            </View>
          </View>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Events</Text>
          </View>
          <View style={styles.eventCard}>
            <View style={styles.eventContent}>
              <Text>Switch to Events tab to join drives!</Text>
            </View>
          </View>
        </ScrollView>
      );
    }
    if (activeTab === "Settings") {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>{userData.email}</Text>
          <TouchableOpacity
            onPress={handleLogout}
            style={[styles.button, styles.logoutButton]}
          >
            <Text style={styles.buttonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={styles.container}>
        <Text>Screen coming soon!</Text>
      </View>
    );
  };

  return (
    <View style={styles.dashboardLayout}>
      {/* ✅ FIX FOR CLASSIFY TAB */}
      <View style={{ flex: 1 }}>{renderContent()}</View>

      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};

// --- ORGANISER DASHBOARD ---

const OrganiserDashboard = ({ userData, handleLogout }) => {
  const [activeTab, setActiveTab] = useState("Home");
  const [showAddEventForm, setShowAddEventForm] = useState(false);
  const [myEvents, setMyEvents] = useState([]);
  const [eventData, setEventData] = useState({
    name: "",
    date: "",
    time: "",
    volunteers: "",
    location: "",
  });
  const [loading, setLoading] = useState(false);
  const [generatingPosterFor, setGeneratingPosterFor] = useState(null); // For per-event loading

  // NEW: Store generated posters, captions, and visibility state
  const [posterDataMap, setPosterDataMap] = useState({});

  // NEW: Toggle visibility of the poster and captions
  const togglePosterView = (eventId) => {
    setPosterDataMap((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        isVisible: !prev[eventId].isVisible,
      },
    }));
  };

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const res = await axios.get(
        `${BACKEND_URL}/api/events/organiser-stats/${userData.firebaseUid}`,
      );
      setMyEvents(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitEvent = async () => {
    if (
      !eventData.name ||
      !eventData.date ||
      !eventData.time ||
      !eventData.volunteers ||
      !eventData.location
    ) {
      Alert.alert("Error", "Please fill all fields.");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${BACKEND_URL}/api/events/create`, {
        organiserUid: userData.firebaseUid,
        ...eventData,
        volunteersRequired: Number(eventData.volunteers),
      });
      Alert.alert("Success", "Event created!");
      setEventData({
        name: "",
        date: "",
        time: "",
        volunteers: "",
        location: "",
      });
      setShowAddEventForm(false);
      fetchMyEvents();
    } catch (err) {
      Alert.alert("Error", "Failed to create event.");
    } finally {
      setLoading(false);
    }
  };

  // NEW: Generate Poster Handler
  // const handleGeneratePoster = async (eventId, eventName) => {
  //   setGeneratingPosterFor(eventId);
  //   try {
  //     const res = await axios.post(`${BACKEND_URL}/api/events/${eventId}/generate-poster`, {
  //       // Optional: send any overrides or preferences
  //       eventName: eventName, // For logging/customization
  //     });

  //     if (res.data.success && res.data.posterUrl) {
  //       Alert.alert(
  //         'Poster Generated! 🎉',
  //         `Your poster for "${eventName}" is ready.`,
  //         [
  //           {
  //             text: 'View Poster',
  //             onPress: () => Linking.openURL(res.data.posterUrl)
  //           },
  //           { text: 'OK' }
  //         ]
  //       );

  //       // Optional: Refresh events if needed (e.g., if you store posterUrl in DB)
  //       // fetchMyEvents();
  //     } else {
  //       Alert.alert('Error', res.data.message || 'Failed to generate poster');
  //     }
  //   } catch (err) {
  //     console.error('Poster generation error:', err);
  //     Alert.alert('Error', 'Could not generate poster. Please try again.');
  //   } finally {
  //     setGeneratingPosterFor(null);
  //   }
  // };

  const handleGeneratePoster = async (eventId, eventName) => {
    setGeneratingPosterFor(eventId);
    try {
      const res = await axios.post(
        `${BACKEND_URL}/api/events/${eventId}/generate-poster`,
        {
          eventName: eventName,
        },
      );

      if (res.data.success && res.data.posterUrl) {
        // NEW: Save poster URL and captions to state, hidden by default
        setPosterDataMap((prev) => ({
          ...prev,
          [eventId]: {
            url: res.data.posterUrl,
            captions: res.data.captions, // Ensure your backend sends this object
            isVisible: false,
          },
        }));

        Alert.alert(
          "Poster Generated! 🎉",
          `Your poster for "${eventName}" is ready. Click 'View Poster' to see it.`,
        );
      } else {
        Alert.alert("Error", res.data.message || "Failed to generate poster");
      }
    } catch (err) {
      console.error("Poster generation error:", err);
      Alert.alert("Error", "Could not generate poster. Please try again.");
    } finally {
      setGeneratingPosterFor(null);
    }
  };

  const renderContent = () => {
    if (activeTab === "Events") {
      if (showAddEventForm) {
        return (
          <ScrollView contentContainerStyle={{ padding: 20 }}>
            <Text style={styles.title}>Add Event</Text>
            <TextInput
              placeholder="Event Name"
              value={eventData.name}
              onChangeText={(t) => setEventData({ ...eventData, name: t })}
              style={styles.input}
            />
            <TextInput
              placeholder="Date (YYYY-MM-DD)"
              value={eventData.date}
              onChangeText={(t) => setEventData({ ...eventData, date: t })}
              style={styles.input}
            />
            <TextInput
              placeholder="Time (HH:MM)"
              value={eventData.time}
              onChangeText={(t) => setEventData({ ...eventData, time: t })}
              style={styles.input}
            />
            <TextInput
              placeholder="Volunteers Required"
              value={eventData.volunteers}
              onChangeText={(t) =>
                setEventData({ ...eventData, volunteers: t })
              }
              style={styles.input}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Location"
              value={eventData.location}
              onChangeText={(t) => setEventData({ ...eventData, location: t })}
              style={styles.input}
            />
            <TouchableOpacity
              onPress={handleSubmitEvent}
              style={[styles.button, { backgroundColor: THEME.green }]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAddEventForm(false)}>
              <Text style={styles.linkText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        );
      }
      return (
        <ScrollView style={{ flex: 1 }}>
          <View style={styles.headerContainer}>
            <Text style={styles.homeTitle}>My Events</Text>
          </View>
          <TouchableOpacity
            style={[styles.button, { margin: 20, backgroundColor: THEME.blue }]}
            onPress={() => setShowAddEventForm(true)}
          >
            <Text style={styles.buttonText}>+ Add New Event</Text>
          </TouchableOpacity>

          {myEvents.map((ev) => {
            // Check if we have generated poster data for this specific event
            const hasPosterData = posterDataMap[ev._id];

            return (
              <View
                key={ev._id}
                style={[
                  styles.eventCard,
                  { padding: 15, position: "relative" },
                ]}
              >
                {/* Event Details - Wrapped in a View with paddingRight to avoid overlapping buttons */}
                <View style={{ paddingRight: 130 }}>
                  <Text style={styles.eventTitle}>{ev.name}</Text>
                  <Text
                    style={{
                      color: THEME.green,
                      fontWeight: "bold",
                      marginTop: 5,
                    }}
                  >
                    Volunteers Joined: {ev.participants?.length || 0}
                  </Text>

                  {/* Participants List */}
                  {ev.participants?.length > 0 && (
                    <View style={{ marginTop: 8, marginBottom: 12 }}>
                      {ev.participants.map((p, i) => (
                        <Text key={i} style={{ fontSize: 12, color: "#666" }}>
                          • {p.name}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Action Buttons Container - Positioned Top Right */}
                <View
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    alignItems: "flex-end",
                    gap: 8,
                  }}
                >
                  {/* Generate Poster Button */}
                  <TouchableOpacity
                    style={{
                      backgroundColor: "#FF6B35",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.18,
                      shadowRadius: 2,
                      elevation: 2,
                      minWidth: 110,
                    }}
                    onPress={() => handleGeneratePoster(ev._id, ev.name)}
                    disabled={generatingPosterFor === ev._id}
                  >
                    <Text
                      style={{
                        color: "white",
                        fontSize: 13,
                        fontWeight: "600",
                      }}
                    >
                      {generatingPosterFor === ev._id
                        ? "Generating…"
                        : "Generate Poster"}
                    </Text>
                    <Text style={{ fontSize: 14 }}></Text>
                  </TouchableOpacity>

                  {/* View/Hide Poster Button (Only shows if poster exists) */}
                  {hasPosterData && (
                    <TouchableOpacity
                      style={{
                        backgroundColor: "#2A9D8F",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 6,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        elevation: 2,
                        minWidth: 110,
                      }}
                      // onPress={() => togglePosterView(ev._id)}
                       onPress={() => {
                        const url = posterDataMap[ev._id].url;
                        window.open(url, "_blank");   // 🌐 opens in new tab
                      }}
                      
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 13,
                          fontWeight: "600",
                        }}
                      >
                        {hasPosterData.isVisible
                          ? "Hide Poster"
                          : "View Poster"}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Expandable Poster & Captions Section */}
                {hasPosterData && hasPosterData.isVisible && (
                  <View
                    style={{
                      marginTop: 20,
                      paddingTop: 15,
                      borderTopWidth: 1,
                      borderColor: "#eee",
                    }}
                  >
                    {/* The Generated Image */}
                    {/*<Image 
                      source={{ uri: hasPosterData.url }} 
                      style={{ width: '100%', height: 350, resizeMode: 'contain', borderRadius: 8, backgroundColor: '#f0f0f0' }} 
                    />*/}

                    <WebView
                      source={{ uri: hasPosterData.url }}
                      style={{ width: "100%", height: 400 }}
                      originWhitelist={["*"]}
                    />

                    {/* The Generated Captions */}
                    {hasPosterData.captions && (
                      <View style={{ marginTop: 15, gap: 12 }}>
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "bold",
                            color: "#333",
                          }}
                        >
                          Social Media Captions:
                        </Text>

                        {hasPosterData.captions.Instagram && (
                          <View>
                            <Text
                              style={{ fontWeight: "600", color: "#E1306C" }}
                            >
                              Instagram
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#555",
                                marginTop: 4,
                              }}
                            >
                              {hasPosterData.captions.Instagram}
                            </Text>
                          </View>
                        )}

                        {hasPosterData.captions.Facebook && (
                          <View>
                            <Text
                              style={{ fontWeight: "600", color: "#1877F2" }}
                            >
                              Facebook
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#555",
                                marginTop: 4,
                              }}
                            >
                              {hasPosterData.captions.Facebook}
                            </Text>
                          </View>
                        )}

                        {hasPosterData.captions.LinkedIn && (
                          <View>
                            <Text
                              style={{ fontWeight: "600", color: "#0A66C2" }}
                            >
                              LinkedIn
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#555",
                                marginTop: 4,
                              }}
                            >
                              {hasPosterData.captions.LinkedIn}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })}

          {myEvents.length === 0 && (
            <View style={{ padding: 40, alignItems: "center" }}>
              <Text style={{ color: "#888", fontSize: 16 }}>
                No events yet. Create one!
              </Text>
            </View>
          )}
        </ScrollView>
      );
    }

    return (
      <ScrollView style={{ flex: 1 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.homeTitle}>Home</Text>
        </View>
        <View style={{ alignItems: "center", marginVertical: 20 }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: THEME.green,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontSize: 28 }}>
              {userData.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={{ fontSize: 20, fontWeight: "600", marginTop: 10 }}>
            {userData.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.button, styles.logoutButton, { margin: 20 }]}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  };

  return (
    <View style={styles.dashboardLayout}>
      {renderContent()}
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};

// --- CSR DASHBOARD ---

const CSRDashboard = ({ userData, handleLogout }) => {
  const [activeTab, setActiveTab] = useState("Home");
  return (
    <View style={styles.dashboardLayout}>
      <View style={styles.container}>
        <Text>CSR Dashboard coming soon</Text>
        <TouchableOpacity
          onPress={handleLogout}
          style={[styles.button, styles.logoutButton]}
        >
          <Text style={styles.buttonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
      <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />
    </View>
  );
};

// --- MAIN APP ---

export default function AppLogic() {
  const [screen, setScreen] = useState("welcome");
  const [selectedRole, setSelectedRole] = useState(null);
  const [userData, setUserData] = useState(null);

  // useEffect(() => {
  //   const unsubscribe = auth.onAuthStateChanged(async (user) => {
  //     if (user && !userData) {
  //       try {
  //         const response = await axios.get(`${BACKEND_URL}/api/users/role/${user.uid}`);
  //         setUserData({ ...response.data, firebaseUid: user.uid, email: user.email });
  //         setScreen('dashboard');
  //       } catch (err) { setScreen('welcome'); }
  //     } else if (!user) {
  //       setUserData(null);
  //       if (!['register', 'login'].includes(screen)) setScreen('welcome');
  //     }
  //   });
  //   return unsubscribe;
  // }, [userData, screen]);

  // --- PLACE INSIDE AppLogic function ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user && !userData) {
        // Only fetch from MongoDB if we aren't in the middle of registering
        if (screen !== "register") {
          try {
            const response = await axios.get(
              `${BACKEND_URL}/api/users/role/${user.uid}`,
            );
            setUserData({
              ...response.data,
              firebaseUid: user.uid,
              email: user.email,
            });
            setScreen("dashboard");
          } catch (err) {
            if (err.response && err.response.status === 404) {
              console.log(
                "User authenticated in Firebase but not found in MongoDB. Stay on welcome/register.",
              );
              setScreen("welcome");
            } else {
              console.error("Network or Server Error:", err);
            }
          }
        }
      } else if (!user) {
        setUserData(null);
        if (!["register", "login"].includes(screen)) setScreen("welcome");
      }
    });
    return unsubscribe;
  }, [userData, screen]);

  const handleLogout = async () => {
    await signOut(auth);
    setUserData(null);
    setScreen("welcome");
  };

  const renderScreen = () => {
    if (screen === "dashboard" && userData) {
      const role = userData.role?.toLowerCase();
      if (role === "volunteer")
        return (
          <VolunteerDashboard userData={userData} handleLogout={handleLogout} />
        );
      if (role === "organiser")
        return (
          <OrganiserDashboard userData={userData} handleLogout={handleLogout} />
        );
      if (role === "csr")
        return <CSRDashboard userData={userData} handleLogout={handleLogout} />;
    }
    if (screen === "register")
      return (
        <RegisterScreen
          role={selectedRole}
          setScreen={setScreen}
          setRole={setSelectedRole}
          setUserData={setUserData}
        />
      );
    if (screen === "login")
      return <LoginScreen setScreen={setScreen} setUserData={setUserData} />;
    return (
      <WelcomeScreen
        setRole={setSelectedRole}
        setIsRegistering={() => setScreen("register")}
        setIsLoggedIn={() => setScreen("login")}
      />
    );
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}
