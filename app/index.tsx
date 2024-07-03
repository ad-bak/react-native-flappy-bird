import { Canvas, Slant, Group, Image, interpolate, matchFont, Text, useImage, Fill } from "@shopify/react-native-skia";
import { useEffect, useState } from "react";
import { Alert, Platform, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import {
  cancelAnimation,
  Easing,
  Extrapolation,
  runOnJS,
  useAnimatedReaction,
  useDerivedValue,
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
  const [score, setScore] = useState(0);

  const fontFamily = Platform.select({ ios: "Helvetica", android: "SpaceMono-Regular" });

  const fontStyle = {
    fontFamily,
    fontSize: 40,
    fontStyle: "none",
    fontWeight: "bold",
  } as const;

  const font = matchFont(fontStyle);

  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/yellowbird-upflap.png"));
  const pipe = useImage(require("../assets/sprites/pipe-green.png"));
  const pipeReverse = useImage(require("../assets/sprites/pipe-green-reverse.png"));
  const base = useImage(require("../assets/sprites/base.png"));

  const gameOver = useSharedValue(false);

  const x = useSharedValue(width);

  const birdY = useSharedValue(height / 3);
  const birdVelocity = useSharedValue(0);
  const birdTransform = useDerivedValue(() => {
    return [{ rotate: interpolate(birdVelocity.value, [-500, 500], [-0.5, 0.5], Extrapolation.CLAMP) }];
  });
  const birdOrigin = useDerivedValue(() => {
    return { x: width / 4 + 32, y: birdY.value + 24 };
  });
  const birdPos = {
    x: width / 4,
    y: birdY.value,
  };

  useFrameCallback(({ timeSincePreviousFrame }) => {
    if (!timeSincePreviousFrame || gameOver.value === true) {
      return;
    }

    const dt = timeSincePreviousFrame / 1000;
    birdVelocity.value += GRAVITY * dt;
    birdVelocity.value = Math.min(Math.max(birdVelocity.value, -MAX_VELOCITY), MAX_VELOCITY);
    birdY.value += birdVelocity.value * dt;

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
  }, []);

  useAnimatedReaction(
    () => x.value,
    (currentValue, previousValue) => {
      const middle = birdPos.x;

      if (currentValue !== previousValue && previousValue && currentValue <= middle && previousValue > middle) {
        runOnJS(setScore)(score + 1);
      }
    }
  );

  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      if (currentValue > height - 130) {
        gameOver.value = true;
        cancelAnimation(x);
      }
    }
  );

  useAnimatedReaction(
    () => gameOver.value,
    (currentValue, previousValue) => {
      if (currentValue && !previousValue) {
        cancelAnimation(x);
      }
    }
  );

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

          <Group transform={birdTransform} origin={birdOrigin}>
            <Image image={bird} y={birdY} x={birdPos.x} width={64} height={48} fit="contain" />
          </Group>

          <Text y={100} text={score.toString()} font={font} x={width / 2 - 20} />
        </Canvas>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
