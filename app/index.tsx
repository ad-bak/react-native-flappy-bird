import {
  Canvas,
  Group,
  Image,
  interpolate,
  matchFont,
  Text,
  useImage,
  Fill,
  Circle,
  Rect,
} from "@shopify/react-native-skia";
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
const PIPE_WIDTH = 103;
const PIPE_HEIGHT = 640;

export default function Index() {
  const { width, height } = useWindowDimensions();
  const [score, setScore] = useState(0);

  const fontFamily = Platform.select({ ios: "Helvetica", android: "SpaceMono-Regular" });

  const fontStyle = {
    fontFamily,
    fontSize: 40,
    fontStyle: "normal",
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
  const birdX = width / 4;
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

  const birdCenterX = useDerivedValue(() => birdPos.x + 32);
  const birdCenterY = useDerivedValue(() => birdY.value + 24);
  const pipeOffset = useSharedValue(0);
  const topPipeY = useDerivedValue(() => height - 320);
  const bottomPipeY = useDerivedValue(() => -320 + pipeOffset.value);

  const obstacles = useDerivedValue(() => [
    {
      x: x.value,
      y: height - 320 + pipeOffset.value,
      h: PIPE_HEIGHT,
      w: PIPE_WIDTH,
    },
    // top pipe
    {
      x: x.value,
      y: pipeOffset.value - 320,
      h: PIPE_HEIGHT,
      w: PIPE_WIDTH,
    },
  ]);

  const moveTheMap = () => {
    x.value = withRepeat(
      withSequence(withTiming(-150, { duration: 4000, easing: Easing.linear }), withTiming(width, { duration: 0 })),
      -1
    );
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
    moveTheMap();
  }, []);

  useAnimatedReaction(
    () => x.value,
    (currentValue, previousValue) => {
      const middle = birdPos.x;

      if (previousValue && currentValue < 0 && previousValue > 0) {
        pipeOffset.value = Math.random() * (height - 320 - 320);
      }

      if (currentValue !== previousValue && previousValue && currentValue <= middle && previousValue > middle) {
        runOnJS(setScore)(score + 1);
      }
    }
  );

  const isPointCollidingWithRect = (
    point: { x: number; y: number },
    rect: { x: number; y: number; w: number; h: number }
  ) => {
    "worklet";
    return (
      point.x >= rect.x && // right of the left edge AND
      point.x <= rect.x + rect.w && // left of the right edge AND
      point.y >= rect.y && // below the top AND
      point.y <= rect.y + rect.h // above the bottom
    );
  };

  // Collision detection
  useAnimatedReaction(
    () => birdY.value,
    (currentValue, previousValue) => {
      const center = {
        x: birdX + 32,
        y: birdY.value + 24,
      };

      if (currentValue > height - 130 || currentValue < 0) {
        gameOver.value = true;
      }

      const isColliding = obstacles.value.some((rect) => isPointCollidingWithRect(center, rect));
      if (isColliding) {
        gameOver.value = true;
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

  const restartGame = () => {
    "worklet";
    birdY.value = height / 3;
    birdVelocity.value = 0;
    gameOver.value = false;
    x.value = width;
    runOnJS(setScore)(0);
    runOnJS(moveTheMap)();
  };

  const gesture = Gesture.Tap().onStart(() => {
    if (gameOver.value) {
      restartGame();
    } else {
      birdVelocity.value = JUMP_FORCE;
    }
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={gesture}>
        <Canvas style={{ width, height }}>
          <Image image={bg} width={width} height={height} fit="cover" />

          <Image image={pipe} y={topPipeY.value} x={x} width={PIPE_WIDTH} height={PIPE_HEIGHT} />
          <Image image={pipeReverse} y={bottomPipeY.value} x={x} width={PIPE_WIDTH} height={PIPE_HEIGHT} />

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
