import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import type { AnimationType } from '@animations-core/types';
import { BeatingHeartCanvas } from '../animations/BeatingHeartCanvas';
import { LavaDotsCanvas } from '../animations/LavaDotsCanvas';
import { FloatingHeartsCanvas } from '../animations/FloatingHeartsCanvas';

// hidden: true keeps the animation type fully functional (selectable via
// AnimationType, still renders) but removes its button from the picker.
const ANIMATIONS: { type: AnimationType; label: string; icon: string; hidden?: boolean }[] = [
  { type: 'dots', label: 'Lava Dots', icon: '⬤', hidden: true },
  { type: 'hearts', label: 'Lava Hearts', icon: '❤️‍🔥' },
  { type: 'beating-heart', label: 'Beating Heart', icon: '💓', hidden: true },
  { type: 'beating-heart-shapes', label: 'Heart Pulse', icon: '💓' },
  { type: 'floating-hearts', label: 'Floating Hearts', icon: '💕', hidden: true },
  { type: 'floating-hearts-shapes', label: 'Heart Drift', icon: '💕' },
];

const SUBTITLES: Record<AnimationType, string> = {
  dots: 'Generating a more detailed image — hang tight.',
  hearts: 'Crafting something beautiful for you…',
  'beating-heart': 'Pouring some love into this — almost there.',
  'beating-heart-shapes': 'Pouring some love into this — almost there.',
  'floating-hearts': 'HeartStamp is thinking of you 💕',
  'floating-hearts-shapes': 'HeartStamp is thinking of you 💕',
};

export function AnimationDemoScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [isDark, setIsDark] = useState(true);
  const [animationType, setAnimationType] = useState<AnimationType>('hearts');
  const [gridSpacing, setGridSpacing] = useState(18);

  const canvasWidth  = windowWidth - 32;
  const canvasHeight = Math.round(canvasWidth * (600 / 740)); // match web aspect ratio

  return (
    <SafeAreaView style={[styles.safe, isDark ? styles.bgDark : styles.bgLight]}>
      <View style={styles.container}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.heading, isDark ? styles.textLight : styles.textDark]}>
            Thinking_
          </Text>
          <Text style={[styles.subtitle, isDark ? styles.subtitleDark : styles.subtitleLight]}>
            {SUBTITLES[animationType]}
          </Text>
        </View>

        {/* Canvas */}
        <View style={[styles.canvasWrapper, isDark ? styles.canvasBgDark : styles.canvasBgLight]}>
          {renderAnimation(animationType, canvasWidth, canvasHeight, gridSpacing, isDark)}
        </View>

        {/* Animation picker */}
        <View style={styles.animRow}>
          {ANIMATIONS.filter(a => !a.hidden).map(({ type, label, icon }) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.animBtn,
                isDark ? styles.btnDark : styles.btnLight,
                animationType === type && styles.btnActive,
              ]}
              onPress={() => setAnimationType(type)}
            >
              <Text style={styles.animIcon}>{icon}</Text>
              <Text style={[
                styles.animLabel,
                isDark ? styles.textLight : styles.textDark,
                animationType === type && styles.btnActiveLabel,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Dark mode toggle */}
        <TouchableOpacity
          style={[styles.toggleBtn, isDark ? styles.btnDark : styles.btnLight]}
          onPress={() => setIsDark(d => !d)}
        >
          <Text style={[styles.toggleBtnLabel, isDark ? styles.textLight : styles.textDark]}>
            {isDark ? '☀️  Light mode' : '🌙  Dark mode'}
          </Text>
        </TouchableOpacity>

        {/* Grid spacing */}
        <View style={styles.spacingRow}>
          <Text style={[styles.spacingLabel, isDark ? styles.textLight : styles.textDark]}>
            Grid spacing: {gridSpacing}px
          </Text>
          <View style={styles.spacingButtons}>
            {[12, 15, 18, 22, 28].map(s => (
              <TouchableOpacity
                key={s}
                style={[
                  styles.spacingBtn,
                  isDark ? styles.btnDark : styles.btnLight,
                  gridSpacing === s && styles.btnActive,
                ]}
                onPress={() => setGridSpacing(s)}
              >
                <Text style={[
                  styles.spacingBtnLabel,
                  isDark ? styles.textLight : styles.textDark,
                  gridSpacing === s && styles.btnActiveLabel,
                ]}>
                  {s}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

      </View>
    </SafeAreaView>
  );
}

function renderAnimation(
  type: AnimationType,
  width: number,
  height: number,
  gridSpacing: number,
  isDark: boolean
) {
  switch (type) {
    case 'dots':
      return <LavaDotsCanvas width={width} height={height} gridSpacing={gridSpacing} isDark={isDark} useHearts={false} />;
    case 'hearts':
      return <LavaDotsCanvas width={width} height={height} gridSpacing={gridSpacing} isDark={isDark} useHearts />;
    case 'beating-heart':
      return <BeatingHeartCanvas width={width} height={height} gridSpacing={gridSpacing} isDark={isDark} useHearts={false} />;
    case 'beating-heart-shapes':
      return <BeatingHeartCanvas width={width} height={height} gridSpacing={gridSpacing} isDark={isDark} useHearts />;
    case 'floating-hearts':
      return <FloatingHeartsCanvas width={width} height={height} gridSpacing={gridSpacing} isDark={isDark} useHearts={false} />;
    case 'floating-hearts-shapes':
      return <FloatingHeartsCanvas width={width} height={height} gridSpacing={gridSpacing} isDark={isDark} useHearts />;
  }
}

const styles = StyleSheet.create({
  safe:             { flex: 1 },
  bgDark:           { backgroundColor: '#000000' },
  bgLight:          { backgroundColor: '#f4f4f5' },
  container:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 14 },
  header:           { alignSelf: 'stretch' },
  heading:          { fontSize: 22, fontWeight: '300', letterSpacing: 1.5 },
  subtitle:         { fontSize: 14, marginTop: 4 },
  subtitleDark:     { color: '#a1a1aa' },
  subtitleLight:    { color: '#52525b' },
  textLight:        { color: '#ffffff' },
  textDark:         { color: '#18181b' },
  canvasWrapper:    { borderRadius: 16, overflow: 'hidden' },
  canvasBgDark:     { backgroundColor: '#18181b' },
  canvasBgLight:    { backgroundColor: '#ffffff' },
  animRow:          { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignSelf: 'stretch' },
  animBtn:          { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  animIcon:         { fontSize: 13 },
  animLabel:        { fontSize: 12, fontWeight: '500' },
  toggleBtn:        { alignSelf: 'stretch', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  toggleBtnLabel:   { fontSize: 14, fontWeight: '500' },
  btnDark:          { backgroundColor: '#27272a' },
  btnLight:         { backgroundColor: '#e4e4e7' },
  btnActive:        { backgroundColor: '#f43f5e' },
  btnActiveLabel:   { color: '#ffffff' },
  spacingRow:       { alignSelf: 'stretch', gap: 8 },
  spacingLabel:     { fontSize: 12, opacity: 0.6 },
  spacingButtons:   { flexDirection: 'row', gap: 8 },
  spacingBtn:       { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  spacingBtnLabel:  { fontSize: 12, fontWeight: '500' },
});
