import { Canvas, Image, useImage } from "@shopify/react-native-skia";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useWindowDimensions, View } from "react-native";

export default function Index() {
  const { width, height } = useWindowDimensions();

  // Use the image for background
  const bg = useImage(require("../assets/sprites/background-day.png"));
  const bird = useImage(require("../assets/sprites/yellowbird-upflap.png"));

  return (
    <>
      {/* Ensure the View component takes up all available space and no padding is applied */}
      <View style={{ flex: 1, paddingTop: 0 }}>
        <Canvas style={{ width, height }}>
          <Image image={bg} width={width} height={height} fit="cover" />
          <Image image={bird} y={height / 2} x={120} width={64} height={48} fit="contain" />
        </Canvas>
      </View>
    </>
  );
}
