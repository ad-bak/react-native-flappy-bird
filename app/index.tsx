import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useWindowDimensions, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  Easing,
  useFrameCallback,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

const GRAVITY = 1000;
const JUMP_FORCE = -400;
const MAX_VELOCITY = 600;

export default function Index() {
  const { width, height } = useWindowDimensions();

  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/yellowbird-upflap.png"));
  const pipe = useImage(require("../assets/sprites/pipe-green.png"));
  const pipeReverse = useImage(require("../assets/sprites/pipe-green-reverse.png"));
  const base = useImage(require("../assets/sprites/base.png"));

  const x = useSharedValue(width);

  const birdY = useSharedValue(height / 3);
  const birdVelocity = useSharedValue(0);

  useFrameCallback(({ timeSincePreviousFrame }) => {
    if (!timeSincePreviousFrame) return;

    const dt = timeSincePreviousFrame / 1000;
    birdVelocity.value += GRAVITY * dt;
    birdVelocity.value = Math.min(Math.max(birdVelocity.value, -MAX_VELOCITY), MAX_VELOCITY);
    birdY.value += birdVelocity.value * dt;

    // Prevent bird from going off screen
    if (birdY.value > height - 123) {
      birdY.value = height - 123;
      birdVelocity.value = 0;
    }
    if (birdY.value < 0) {
      birdY.value = 0;
      birdVelocity.value = 0;
    }
  });

  useEffect(() => {
    x.value = withRepeat(
      withSequence(withTiming(-150, { duration: 4000, easing: Easing.linear }), withTiming(width, { duration: 0 })),
      -1
    );
  }, [x, width]);

  const gesture = Gesture.Tap().onStart(() => {
    birdVelocity.value = JUMP_FORCE;
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          <Image image={bg} width={width} height={height} fit="cover" />

          <Image image={pipe} y={height - 320} x={x} width={103} height={640} />
          <Image image={pipeReverse} y={-320} x={x} width={103} height={640} />

          <Image image={base} y={height - 75} width={width} height={100} x={0} fit="fill" />

          <Image image={bird} y={birdY} x={width / 2 - 32} width={64} height={48} fit="contain" />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
