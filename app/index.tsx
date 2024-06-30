import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { useWindowDimensions, View } from "react-native";
import { Easing, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

export default function Index() {
  const { width, height } = useWindowDimensions();

  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/yellowbird-upflap.png"));
  const pipe = useImage(require("../assets/sprites/pipe-green.png"));
  const pipeReverse = useImage(require("../assets/sprites/pipe-green-reverse.png"));
  const base = useImage(require("../assets/sprites/base.png"));

  const pipeOffset = 0;

  const x = useSharedValue(width);

  useEffect(() => {
    x.value = withRepeat(
      withTiming(-150, { duration: 3000, easing: Easing.linear }),
      withTiming(width, { duration: 0 })
    );
  }, [x]);

  return (
    <>
      <View style={{ flex: 1, paddingTop: 0 }}>
        <Canvas style={{ width, height }}>
          <Image image={bg} width={width} height={height} fit="cover" />

          <Image image={pipe} y={height - 320} x={x} width={103} height={640} />
          <Image image={pipeReverse} y={-320} x={x} width={103} height={640} />

          <Image image={base} y={height - 75} width={width} height={100} x={0} fit="fill" />

          <Image image={bird} y={height / 2 - 24} x={width / 2 - 32} width={64} height={48} fit="contain" />
        </Canvas>
      </View>
    </>
  );
}
