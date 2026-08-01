import { Image, type ImageStyle, type StyleProp } from "react-native";

/** The CamHealth app mark (heart + ECG pulse on a navy→teal badge). */
export function Logo({ size = 72, style }: { size?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      source={require("../assets/icon.png")}
      style={[{ width: size, height: size, borderRadius: size * 0.225 }, style]}
      resizeMode="contain"
    />
  );
}
