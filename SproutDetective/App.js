/**
 * ================================================================
 *  SPROUT – "Nature Detective"
 *  NO API KEY NEEDED - Smart Mock Detection
 *  Works on: Expo Go (Android/iOS) + Web Browser
 * ================================================================
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, Image, ScrollView, StatusBar, Platform,
  Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width: W } = Dimensions.get('window');
const IS_WEB = Platform.OS === 'web';
const TARGET_COUNT = 5;

// ── MOCK DATA (No API needed!) ───────────────────────────────
const MOCK_DATA = {
  flowers: [
    { name: 'Rose',        funFact: 'Roses have been around for 35 million years!' },
    { name: 'Sunflower',   funFact: 'Sunflowers always face the sun during the day!' },
    { name: 'Marigold',    funFact: 'Marigolds can keep bugs away from other plants!' },
    { name: 'Lotus',       funFact: 'Lotus flowers grow in muddy water but stay clean!' },
    { name: 'Jasmine',     funFact: 'Jasmine flowers smell the strongest at night!' },
    { name: 'Daisy',       funFact: 'Each daisy is actually made of many tiny flowers!' },
  ],
  electric: [
    { name: 'Mobile Phone',    funFact: 'Your phone has more power than a 1969 moon rocket!' },
    { name: 'Television',      funFact: 'The first TV remote was called "Lazy Bones" in 1950!' },
    { name: 'Electric Fan',    funFact: 'Fans don\'t cool air — they cool YOU by moving air!' },
    { name: 'Refrigerator',    funFact: 'Fridges keep food 10 times longer than room temperature!' },
    { name: 'Laptop',          funFact: 'A laptop uses 80% less energy than a desktop computer!' },
    { name: 'LED Bulb',        funFact: 'LED bulbs last 25 times longer than old bulbs!' },
    { name: 'Charger',         funFact: 'Chargers still use electricity even when not charging!' },
    { name: 'Speaker',         funFact: 'Speakers work by vibrating air to make sound waves!' },
  ],
  animals: [
    { name: 'Dog',      funFact: 'Dogs can smell 100,000 times better than humans!' },
    { name: 'Cat',      funFact: 'Cats sleep 12 to 16 hours every single day!' },
    { name: 'Bird',     funFact: 'Some birds can fly 500 miles without stopping!' },
    { name: 'Fish',     funFact: 'Fish can remember things for up to 5 months!' },
    { name: 'Rabbit',   funFact: 'Rabbits can jump over 3 feet high in one leap!' },
    { name: 'Butterfly',funFact: 'Butterflies taste food with their feet!' },
    { name: 'Cow',      funFact: 'Cows have best friends and get sad when separated!' },
    { name: 'Elephant', funFact: 'Elephants are the only animals that cannot jump!' },
  ],
  colours: [
    { name: 'Red Apple',       funFact: 'Red apples have more antioxidants than green ones!' },
    { name: 'Red Rose',        funFact: 'Red is the first colour babies can see clearly!' },
    { name: 'Red Tomato',      funFact: 'Tomatoes turn red because of a pigment called lycopene!' },
    { name: 'Red Car',         funFact: 'Red cars are actually no more ticketed than other colours!' },
    { name: 'Red Brick',       funFact: 'Red bricks get their colour from iron in the clay!' },
    { name: 'Red Cloth',       funFact: 'Red was the first colour to be used in prehistoric cave art!' },
  ],
};

// ── QUESTS ───────────────────────────────────────────────────
const QUESTS = [
  {
    id: 'flowers',
    title: 'Flower Hunter',
    emoji: '🌸',
    color: '#f43f5e',
    lightColor: '#fda4af',
    instruction: 'Find & snap 5 flowers around you!',
    hint: 'Look for roses, sunflowers, or any colourful blooms!',
    successLabel: 'flowers',
  },
  {
    id: 'electric',
    title: 'Electric Explorer',
    emoji: '⚡',
    color: '#f59e0b',
    lightColor: '#fcd34d',
    instruction: 'Snap 5 electrical devices at home!',
    hint: 'Look for phone, TV, fan, lamp, or charger!',
    successLabel: 'devices',
  },
  {
    id: 'animals',
    title: 'Animal Spotter',
    emoji: '🐾',
    color: '#22c55e',
    lightColor: '#86efac',
    instruction: 'Photograph 5 real or toy animals!',
    hint: 'Find a pet, toy animal, or bird outside!',
    successLabel: 'animals',
  },
  {
    id: 'colours',
    title: 'Colour Quest',
    emoji: '🎨',
    color: '#a855f7',
    lightColor: '#d8b4fe',
    instruction: 'Snap 5 RED objects around you!',
    hint: 'Find red shoes, red fruits, red clothes!',
    successLabel: 'red things',
  },
];

// ── THEME ────────────────────────────────────────────────────
const T = {
  bg: '#080e1a', card: '#111827', card2: '#1e293b',
  border: '#1e293b', border2: '#334155',
  text: '#f1f5f9', muted: '#64748b', muted2: '#94a3b8',
};

// ── MOCK DETECTION (simulates AI) ────────────────────────────
const mockDetect = (questId) => {
  return new Promise((resolve) => {
    // simulate 1.5s "analysing" delay
    setTimeout(() => {
      const pool = MOCK_DATA[questId] || MOCK_DATA.flowers;
      // 85% success rate — feels realistic
      const success = Math.random() > 0.15;
      if (success) {
        const pick = pool[Math.floor(Math.random() * pool.length)];
        resolve({ found: true, name: pick.name, funFact: pick.funFact });
      } else {
        resolve({ found: false, name: '', funFact: '' });
      }
    }, 1500);
  });
};

// ================================================================
//  MAIN APP
// ================================================================
export default function App() {
  const [screen, setScreen]         = useState('home');
  const [quest, setQuest]           = useState(null);
  const [found, setFound]           = useState([]);
  const [analyzing, setAnalyzing]   = useState(false);
  const [resultData, setResultData] = useState(null);
  const [lastPhoto, setLastPhoto]   = useState(null);
  const [permission, requestPermission] = useCameraPermissions();

  const cameraRef   = useRef(null);
  const fileInputRef= useRef(null);
  const fadeAnim    = useRef(new Animated.Value(0)).current;
  const slideAnim   = useRef(new Animated.Value(24)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const bounceAnim  = useRef(new Animated.Value(1)).current;
  const flashAnim   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0); slideAnim.setValue(24);
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 380, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 380, useNativeDriver: true }),
    ]).start();
  }, [screen]);

  const pulseBounce = () => {
    Animated.sequence([
      Animated.spring(bounceAnim, { toValue: 1.15, useNativeDriver: true, tension: 400, friction: 4 }),
      Animated.spring(bounceAnim, { toValue: 1,    useNativeDriver: true, tension: 200 }),
    ]).start();
  };

  const flashScreen = () => {
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 60,  useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();
  };

  const shutterPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.88, duration: 90,  useNativeDriver: true }),
      Animated.spring(scaleAnim,  { toValue: 1,    useNativeDriver: true, tension: 300 }),
    ]).start();
  };

  // ── open camera / file picker ──
  const openCamera = async () => {
    if (IS_WEB) { fileInputRef.current?.click(); return; }
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) { Alert.alert('Camera needed!', 'Please allow camera access.'); return; }
    }
    setScreen('camera');
  };

  // ── web: file upload handler ──
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setLastPhoto(ev.target.result);
      setAnalyzing(true);
      const result = await mockDetect(quest.id);
      setResultData(result);
      setAnalyzing(false);
      setScreen('result');
    };
    reader.readAsDataURL(file);
    // reset input so same file can be re-uploaded
    e.target.value = '';
  };

  // ── native: take picture ──
  const takePicture = async () => {
    if (!cameraRef.current || analyzing) return;
    shutterPress(); flashScreen();
    setAnalyzing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: false, quality: 0.6 });
      setLastPhoto(photo.uri);
      const result = await mockDetect(quest.id);
      setResultData(result);
      setScreen('result');
    } catch (err) {
      setResultData({ found: false, name: '', funFact: 'Could not capture — try again!' });
      setScreen('result');
    }
    setAnalyzing(false);
  };

  // ── accept result ──
  const acceptResult = () => {
    if (resultData?.found) {
      const next = [...found, { name: resultData.name, funFact: resultData.funFact, photo: lastPhoto }];
      setFound(next);
      pulseBounce();
      if (next.length >= TARGET_COUNT) setTimeout(() => setScreen('win'), 500);
      else setScreen('quest');
    } else {
      setScreen(IS_WEB ? 'quest' : 'camera');
    }
  };

  const goHome = () => { setFound([]); setQuest(null); setScreen('home'); };

  // ================================================================
  //  HOME
  // ================================================================
  if (screen === 'home') return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" backgroundColor={T.bg} />
      {IS_WEB && <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileUpload} />}

      <Animated.ScrollView contentContainerStyle={st.homeScroll} showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Logo */}
        <View style={st.logoWrap}>
          <View style={st.logoBadge}><Text style={{ fontSize: 38 }}>🌱</Text></View>
          <Text style={st.logoTitle}>Sprout</Text>
          <Text style={st.logoSub}>NATURE DETECTIVE</Text>
          <Text style={st.logoDesc}>Explore the world around you!{'\n'}Pick a quest and start snapping 📸</Text>
          {IS_WEB && (
            <View style={st.modeBadge}>
              <Text style={st.modeBadgeTxt}>🌐 Web Mode — Upload photos to play!</Text>
            </View>
          )}
        </View>

        <Text style={st.sectionLabel}>CHOOSE YOUR QUEST</Text>

        {QUESTS.map((q) => (
          <TouchableOpacity key={q.id} style={st.qCard} activeOpacity={0.75}
            onPress={() => { setQuest(q); setFound([]); setScreen('quest'); }}>
            <View style={[st.qStrip, { backgroundColor: q.color }]} />
            <View style={[st.qIconBox, { backgroundColor: q.color + '18' }]}>
              <Text style={{ fontSize: 28 }}>{q.emoji}</Text>
            </View>
            <View style={{ flex: 1, paddingVertical: 18, paddingHorizontal: 12 }}>
              <Text style={[st.qTitle, { color: q.lightColor }]}>{q.title}</Text>
              <Text style={st.qInstr}>{q.instruction}</Text>
            </View>
            <View style={[st.qArrowBox, { backgroundColor: q.color + '18' }]}>
              <Text style={[st.qArrow, { color: q.lightColor }]}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/*<View style={st.noBadge}>
          <Text style={st.noBadgeTxt}>🤖 Smart Detection — No API Key Needed!</Text>
        </View>*/}
        <Text style={st.homeFooter}>Made with love for little explorers · Sprout 2026</Text>
      </Animated.ScrollView>
    </View>
  );

  // ================================================================
  //  QUEST DASHBOARD
  // ================================================================
  if (screen === 'quest' && quest) return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" />
      {IS_WEB && <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileUpload} />}

      <Animated.ScrollView contentContainerStyle={st.questScroll} showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Nav */}
        <View style={st.topNav}>
          <TouchableOpacity style={st.backPill} onPress={goHome}>
            <Text style={st.backTxt}>← Back</Text>
          </TouchableOpacity>
          <View style={[st.questPill, { backgroundColor: quest.color + '20', borderColor: quest.color + '40' }]}>
            <Text style={[st.questPillTxt, { color: quest.lightColor }]}>{quest.emoji} {quest.title}</Text>
          </View>
        </View>

        {/* Hero */}
        <Animated.View style={[st.heroWrap, { transform: [{ scale: bounceAnim }] }]}>
          <View style={[st.heroIconBox, { backgroundColor: quest.color + '15', borderColor: quest.color + '35' }]}>
            <Text style={{ fontSize: 52 }}>{quest.emoji}</Text>
          </View>
          <Text style={[st.heroTitle, { color: quest.lightColor }]}>{quest.title}</Text>
          <Text style={st.heroInstr}>{quest.instruction}</Text>
          <View style={st.hintPill}>
            <Text style={st.hintTxt}>💡 {quest.hint}</Text>
          </View>
        </Animated.View>

        {/* Progress */}
        <View style={st.progCard}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <Text style={st.progLabel}>YOUR PROGRESS</Text>
            <Text style={[st.progCount, { color: quest.color }]}>{found.length}/{TARGET_COUNT}</Text>
          </View>
          <View style={st.progTrack}>
            <View style={[st.progFill, { width:`${(found.length/TARGET_COUNT)*100}%`, backgroundColor: quest.color }]} />
          </View>
          <View style={st.starsRow}>
            {Array.from({ length: TARGET_COUNT }).map((_, i) => (
              <Text key={i} style={[st.starTxt, { opacity: i < found.length ? 1 : 0.25 }]}>
                {i < found.length ? '⭐' : '☆'}
              </Text>
            ))}
          </View>
        </View>

        {/* Found items */}
        {found.length > 0 && (
          <View style={st.foundCard}>
            <Text style={st.foundCardLabel}>FOUND SO FAR</Text>
            {found.map((item, i) => (
              <View key={i} style={st.foundRow}>
                {item.photo
                  ? <Image source={{ uri: item.photo }} style={st.foundThumb} />
                  : <View style={[st.foundThumb, { backgroundColor: T.card2, alignItems:'center', justifyContent:'center' }]}>
                      <Text style={{ fontSize: 22 }}>{quest.emoji}</Text>
                    </View>
                }
                <View style={{ flex: 1 }}>
                  <Text style={[st.foundName, { color: quest.lightColor }]}>{i+1}. {item.name}</Text>
                  <Text style={st.foundFact}>💡 {item.funFact}</Text>
                </View>
                <Text style={{ fontSize: 18 }}>✅</Text>
              </View>
            ))}
          </View>
        )}

        {/* Snap Button */}
        <TouchableOpacity style={[st.snapBtn, { backgroundColor: quest.color }]}
          onPress={openCamera} disabled={analyzing} activeOpacity={0.85}>
          {analyzing
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={st.snapBtnTxt}>{IS_WEB ? '🖼  Upload a Photo!' : '📸  Snap a Photo!'}</Text>
          }
        </TouchableOpacity>

        {found.length > 0 && found.length < TARGET_COUNT && (
          <Text style={st.remainTxt}>{TARGET_COUNT - found.length} more {quest.successLabel} to go!</Text>
        )}
      </Animated.ScrollView>
    </View>
  );

  // ================================================================
  //  CAMERA (native only)
  // ================================================================
  if (screen === 'camera' && !IS_WEB) return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[st.flashLayer, { opacity: flashAnim }]} pointerEvents="none" />

      {!permission?.granted ? (
        <View style={st.permBox}>
          <Text style={{ fontSize: 60, marginBottom: 16 }}>📷</Text>
          <Text style={st.permTitle}>Camera Permission</Text>
          <Text style={st.permDesc}>We need your camera to identify objects!</Text>
          <TouchableOpacity style={[st.snapBtn, { backgroundColor: quest?.color, marginTop: 24, width: '80%' }]} onPress={requestPermission}>
            <Text style={st.snapBtnTxt}>Allow Camera</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <CameraView ref={cameraRef} style={StyleSheet.absoluteFill} facing="back" />

          {/* dim top & bottom */}
          <View style={st.dimTop} />
          <View style={st.dimBottom} />

          {/* top bar */}
          <View style={st.camTopBar}>
            <TouchableOpacity style={st.camCloseBtn} onPress={() => setScreen('quest')}>
              <Text style={st.camCloseTxt}>✕</Text>
            </TouchableOpacity>
            <View style={[st.camCountBadge, { backgroundColor: quest?.color + 'cc' }]}>
              <Text style={st.camCountTxt}>{quest?.emoji}  {found.length}/{TARGET_COUNT}</Text>
            </View>
          </View>

          {/* viewfinder corners */}
          <View style={st.vfWrap} pointerEvents="none">
            {[st.vfTL, st.vfTR, st.vfBL, st.vfBR].map((pos, i) => (
              <View key={i} style={[st.vfCorner, pos, { borderColor: quest?.color }]} />
            ))}
          </View>

          {/* instruction */}
          <View style={st.camInstrBox}>
            <Text style={st.camInstrTxt}>{quest?.instruction}</Text>
          </View>

          {/* shutter */}
          <View style={st.shutterWrap}>
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <TouchableOpacity style={[st.shutterRing, { borderColor: quest?.color }]}
                onPress={takePicture} disabled={analyzing} activeOpacity={0.8}>
                <View style={[st.shutterDot, { backgroundColor: analyzing ? '#fbbf24' : '#fff' }]} />
              </TouchableOpacity>
            </Animated.View>
            <Text style={st.shutterHint}>{analyzing ? '🔍 Analysing...' : 'Tap to snap!'}</Text>
          </View>

          {analyzing && (
            <View style={st.analyseOverlay}>
              <ActivityIndicator size="large" color={quest?.color} />
              <Text style={[st.analyseTxt, { color: quest?.lightColor }]}>Identifying...</Text>
            </View>
          )}
        </>
      )}
    </View>
  );

  // ================================================================
  //  RESULT
  // ================================================================
  if (screen === 'result') return (
    <View style={[st.root, { justifyContent:'flex-end' }]}>
      <StatusBar barStyle="light-content" />
      {lastPhoto && <Image source={{ uri: lastPhoto }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor:'rgba(8,14,26,0.72)' }]} />
      {IS_WEB && <input ref={fileInputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileUpload} />}

      <Animated.View style={[st.resultSheet, { opacity: fadeAnim, transform:[{ translateY: slideAnim }] }]}>
        <View style={[st.resultIconBox,
          { backgroundColor: resultData?.found ? quest?.color+'22' : '#f43f5e22',
            borderColor:      resultData?.found ? quest?.color+'55' : '#f43f5e55' }]}>
          <Text style={{ fontSize: 36 }}>{resultData?.found ? '✅' : '❌'}</Text>
        </View>

        <Text style={[st.resultTitle, { color: resultData?.found ? quest?.lightColor : '#f87171' }]}>
          {resultData?.found ? `Found: ${resultData.name}!` : 'Not quite...'}
        </Text>

        {resultData?.found && resultData.funFact ? (
          <View style={st.factBox}>
            <Text style={st.factLabel}>💡  FUN FACT</Text>
            <Text style={st.factTxt}>{resultData.funFact}</Text>
          </View>
        ) : (
          <Text style={st.retryTxt}>
            {IS_WEB ? 'Try uploading a clearer image!' : 'Point the camera more clearly and try again!'}
          </Text>
        )}

        <TouchableOpacity
          style={[st.resultBtn, {
            backgroundColor: resultData?.found ? quest?.color : T.card2,
            borderColor:      resultData?.found ? quest?.color : T.border2,
          }]}
          onPress={acceptResult} activeOpacity={0.85}>
          <Text style={[st.resultBtnTxt, { color: resultData?.found ? '#fff' : quest?.color }]}>
            {resultData?.found ? '🎉  Count it!' : IS_WEB ? '🖼  Try Another' : '📸  Try Again'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setScreen('quest')} style={{ padding: 10, marginTop: 4 }}>
          <Text style={{ color: T.muted, fontSize: 13, fontWeight: '700' }}>← Back to quest</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );

  // ================================================================
  //  WIN
  // ================================================================
  if (screen === 'win') return (
    <View style={st.root}>
      <StatusBar barStyle="light-content" />
      <Animated.ScrollView contentContainerStyle={st.winScroll} showsVerticalScrollIndicator={false}
        style={{ opacity: fadeAnim }}>

        <Animated.View style={[st.trophyBox, { transform:[{ scale: bounceAnim }],
          backgroundColor: quest?.color+'18', borderColor: quest?.color+'35' }]}>
          <Text style={{ fontSize: 60 }}>🏆</Text>
        </Animated.View>

        <Text style={st.winTitle}>You did it!</Text>
        <Text style={[st.winSub, { color: quest?.lightColor }]}>
          {quest?.emoji}  All {TARGET_COUNT} {quest?.successLabel} found!
        </Text>

        <View style={{ flexDirection:'row', gap: 8, marginBottom: 20 }}>
          {['⭐','⭐','⭐'].map((s,i) => <Text key={i} style={{ fontSize: 34 }}>{s}</Text>)}
        </View>

        {/* Score */}
        <View style={[st.scoreBox, { borderColor: quest?.color+'40' }]}>
          <Text style={st.scoreLabel}>TOTAL SCORE</Text>
          <Text style={[st.scoreNum, { color: quest?.color }]}>{TARGET_COUNT * 20} pts</Text>
        </View>

        <Text style={[st.sectionLabel, { alignSelf:'flex-start', marginBottom: 12 }]}>WHAT YOU FOUND</Text>

        {found.map((item, i) => (
          <View key={i} style={st.winItem}>
            {item.photo
              ? <Image source={{ uri: item.photo }} style={st.winThumb} />
              : <View style={[st.winThumb, { backgroundColor: T.card2, alignItems:'center', justifyContent:'center' }]}>
                  <Text style={{ fontSize: 24 }}>{quest?.emoji}</Text>
                </View>
            }
            <View style={{ flex: 1 }}>
              <Text style={[st.foundName, { color: quest?.lightColor }]}>{i+1}. {item.name}</Text>
              <Text style={st.foundFact}>{item.funFact}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={[st.snapBtn, { backgroundColor: quest?.color, marginTop: 24, width:'100%' }]}
          onPress={() => { setFound([]); setScreen('quest'); }} activeOpacity={0.85}>
          <Text style={st.snapBtnTxt}>🔄  Play Again</Text>
        </TouchableOpacity>

        <TouchableOpacity style={{ marginTop: 12, padding: 14 }} onPress={goHome}>
          <Text style={{ color: T.muted2, fontSize: 14, fontWeight:'800' }}>🏠  Choose Another Quest</Text>
        </TouchableOpacity>

      </Animated.ScrollView>
    </View>
  );

  return null;
}

// ================================================================
//  STYLES
// ================================================================
const st = StyleSheet.create({
  root:          { flex:1, backgroundColor: T.bg },

  // HOME
  homeScroll:    { padding:22, paddingTop: Platform.OS==='ios'?64:44, paddingBottom:40 },
  logoWrap:      { alignItems:'center', marginBottom:32 },
  logoBadge:     { width:76, height:76, borderRadius:24, backgroundColor:'#22c55e18', borderWidth:1.5, borderColor:'#22c55e35', alignItems:'center', justifyContent:'center', marginBottom:14 },
  logoTitle:     { fontSize:36, fontWeight:'900', color:T.text, letterSpacing:0.5 },
  logoSub:       { fontSize:11, fontWeight:'800', color:T.muted, letterSpacing:3, marginTop:3, marginBottom:10 },
  logoDesc:      { fontSize:14, color:T.muted2, textAlign:'center', lineHeight:21 },
  modeBadge:     { marginTop:12, backgroundColor:'#3b82f618', borderWidth:1, borderColor:'#3b82f635', borderRadius:50, paddingHorizontal:14, paddingVertical:6 },
  modeBadgeTxt:  { fontSize:12, color:'#93c5fd', fontWeight:'700' },
  sectionLabel:  { fontSize:10, fontWeight:'800', color:T.muted, letterSpacing:2.5, marginBottom:12 },
  noBadge:       { marginTop:24, backgroundColor:'#22c55e12', borderWidth:1, borderColor:'#22c55e30', borderRadius:14, padding:14, alignItems:'center' },
  noBadgeTxt:    { fontSize:13, color:'#86efac', fontWeight:'700', textAlign:'center' },
  homeFooter:    { textAlign:'center', color:T.muted, fontSize:11, marginTop:16 },
  qCard:         { flexDirection:'row', alignItems:'center', backgroundColor:T.card, borderRadius:18, marginBottom:12, borderWidth:1.5, borderColor:T.border, overflow:'hidden' },
  qStrip:        { width:4, alignSelf:'stretch' },
  qIconBox:      { width:58, height:58, alignItems:'center', justifyContent:'center', marginLeft:12 },
  qTitle:        { fontSize:15, fontWeight:'900', marginBottom:3 },
  qInstr:        { fontSize:12, color:T.muted2, lineHeight:17 },
  qArrowBox:     { width:36, height:36, borderRadius:10, alignItems:'center', justifyContent:'center', marginRight:12 },
  qArrow:        { fontSize:22, fontWeight:'900' },

  // QUEST
  questScroll:   { padding:22, paddingTop: Platform.OS==='ios'?64:44, paddingBottom:40 },
  topNav:        { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:24 },
  backPill:      { backgroundColor:T.card, borderRadius:50, paddingHorizontal:14, paddingVertical:7, borderWidth:1, borderColor:T.border },
  backTxt:       { color:T.muted2, fontSize:13, fontWeight:'800' },
  questPill:     { borderRadius:50, paddingHorizontal:14, paddingVertical:7, borderWidth:1 },
  questPillTxt:  { fontSize:12, fontWeight:'800' },
  heroWrap:      { alignItems:'center', marginBottom:24 },
  heroIconBox:   { width:100, height:100, borderRadius:30, alignItems:'center', justifyContent:'center', borderWidth:1.5, marginBottom:14 },
  heroTitle:     { fontSize:24, fontWeight:'900', marginBottom:6 },
  heroInstr:     { fontSize:14, color:T.muted2, textAlign:'center', lineHeight:20, marginBottom:12 },
  hintPill:      { backgroundColor:T.card, borderRadius:50, paddingHorizontal:16, paddingVertical:8, borderWidth:1, borderColor:T.border },
  hintTxt:       { fontSize:12, color:T.muted2, fontWeight:'700' },
  progCard:      { backgroundColor:T.card, borderRadius:20, padding:20, marginBottom:16, borderWidth:1.5, borderColor:T.border },
  progLabel:     { fontSize:10, fontWeight:'800', color:T.muted, letterSpacing:2 },
  progCount:     { fontSize:18, fontWeight:'900' },
  progTrack:     { height:10, backgroundColor:T.bg, borderRadius:10, overflow:'hidden', marginBottom:16 },
  progFill:      { height:'100%', borderRadius:10 },
  starsRow:      { flexDirection:'row', justifyContent:'space-around' },
  starTxt:       { fontSize:24 },
  foundCard:     { backgroundColor:T.card, borderRadius:20, padding:18, marginBottom:16, borderWidth:1.5, borderColor:T.border },
  foundCardLabel:{ fontSize:10, fontWeight:'800', color:T.muted, letterSpacing:2, marginBottom:14 },
  foundRow:      { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  foundThumb:    { width:50, height:50, borderRadius:12 },
  foundName:     { fontSize:14, fontWeight:'800', marginBottom:3 },
  foundFact:     { fontSize:12, color:T.muted2, lineHeight:17 },
  snapBtn:       { borderRadius:50, padding:17, alignItems:'center', marginTop:4 },
  snapBtnTxt:    { color:'#fff', fontSize:16, fontWeight:'900', letterSpacing:0.3 },
  remainTxt:     { textAlign:'center', color:T.muted, fontSize:12, fontWeight:'700', marginTop:12 },

  // CAMERA
  flashLayer:    { position:'absolute', inset:0, backgroundColor:'#fff', zIndex:99 },
  dimTop:        { position:'absolute', top:0, left:0, right:0, height:'20%', backgroundColor:'rgba(0,0,0,0.55)', zIndex:5 },
  dimBottom:     { position:'absolute', bottom:0, left:0, right:0, height:'24%', backgroundColor:'rgba(0,0,0,0.55)', zIndex:5 },
  camTopBar:     { position:'absolute', top: Platform.OS==='ios'?56:36, left:0, right:0, flexDirection:'row', justifyContent:'space-between', alignItems:'center', paddingHorizontal:20, zIndex:10 },
  camCloseBtn:   { width:40, height:40, borderRadius:20, backgroundColor:'rgba(0,0,0,0.6)', alignItems:'center', justifyContent:'center' },
  camCloseTxt:   { color:'#fff', fontSize:16, fontWeight:'900' },
  camCountBadge: { borderRadius:50, paddingHorizontal:16, paddingVertical:8 },
  camCountTxt:   { color:'#fff', fontSize:13, fontWeight:'900' },
  vfWrap:        { position:'absolute', top:'22%', left:W*0.08, right:W*0.08, bottom:'26%', zIndex:6 },
  vfCorner:      { position:'absolute', width:30, height:30, borderWidth:3 },
  vfTL:          { top:0, left:0, borderRightWidth:0, borderBottomWidth:0, borderTopLeftRadius:6 },
  vfTR:          { top:0, right:0, borderLeftWidth:0, borderBottomWidth:0, borderTopRightRadius:6 },
  vfBL:          { bottom:0, left:0, borderRightWidth:0, borderTopWidth:0, borderBottomLeftRadius:6 },
  vfBR:          { bottom:0, right:0, borderLeftWidth:0, borderTopWidth:0, borderBottomRightRadius:6 },
  camInstrBox:   { position:'absolute', bottom:155, left:24, right:24, backgroundColor:'rgba(0,0,0,0.7)', borderRadius:14, padding:13, alignItems:'center', zIndex:10 },
  camInstrTxt:   { color:'#fff', fontSize:13, fontWeight:'800', textAlign:'center' },
  shutterWrap:   { position:'absolute', bottom:48, left:0, right:0, alignItems:'center', zIndex:10 },
  shutterRing:   { width:80, height:80, borderRadius:40, borderWidth:4, backgroundColor:'rgba(255,255,255,0.12)', alignItems:'center', justifyContent:'center' },
  shutterDot:    { width:58, height:58, borderRadius:29 },
  shutterHint:   { color:'rgba(255,255,255,0.6)', fontSize:12, fontWeight:'800', marginTop:10 },
  analyseOverlay:{ position:'absolute', inset:0, backgroundColor:'rgba(8,14,26,0.82)', alignItems:'center', justifyContent:'center', zIndex:20, gap:16 },
  analyseTxt:    { fontSize:16, fontWeight:'800' },
  permBox:       { flex:1, alignItems:'center', justifyContent:'center', padding:40 },
  permTitle:     { fontSize:22, fontWeight:'900', color:T.text, marginBottom:8 },
  permDesc:      { fontSize:14, color:T.muted2, textAlign:'center', lineHeight:20 },

  // RESULT
  resultSheet:   { backgroundColor:T.card, borderTopLeftRadius:32, borderTopRightRadius:32, padding:28, paddingBottom: Platform.OS==='ios'?48:32, borderWidth:1.5, borderColor:T.border, alignItems:'center' },
  resultIconBox: { width:72, height:72, borderRadius:22, alignItems:'center', justifyContent:'center', borderWidth:1.5, marginBottom:14 },
  resultTitle:   { fontSize:20, fontWeight:'900', textAlign:'center', marginBottom:14 },
  factBox:       { backgroundColor:T.bg, borderRadius:16, padding:16, width:'100%', marginBottom:18, borderWidth:1, borderColor:T.border },
  factLabel:     { fontSize:10, fontWeight:'900', color:T.muted, letterSpacing:2, marginBottom:7 },
  factTxt:       { color:T.text, fontSize:14, lineHeight:21 },
  retryTxt:      { color:T.muted2, fontSize:13, textAlign:'center', marginBottom:18, lineHeight:19 },
  resultBtn:     { borderRadius:50, padding:17, width:'100%', alignItems:'center', borderWidth:1.5, marginBottom:12 },
  resultBtnTxt:  { fontSize:15, fontWeight:'900' },

  // WIN
  winScroll:     { padding:24, paddingTop: Platform.OS==='ios'?64:48, paddingBottom:48, alignItems:'center' },
  trophyBox:     { width:110, height:110, borderRadius:32, alignItems:'center', justifyContent:'center', borderWidth:1.5, marginBottom:16 },
  winTitle:      { fontSize:36, fontWeight:'900', color:T.text, marginBottom:6 },
  winSub:        { fontSize:15, fontWeight:'700', marginBottom:20 },
  scoreBox:      { backgroundColor:T.card, borderRadius:20, padding:20, marginBottom:24, width:'100%', alignItems:'center', borderWidth:1.5 },
  scoreLabel:    { fontSize:10, fontWeight:'800', color:T.muted, letterSpacing:2, marginBottom:6 },
  scoreNum:      { fontSize:40, fontWeight:'900' },
  winItem:       { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:T.card, borderRadius:16, padding:14, marginBottom:10, borderWidth:1, borderColor:T.border, width:'100%' },
  winThumb:      { width:54, height:54, borderRadius:14 },
});
