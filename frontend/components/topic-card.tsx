import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette as c } from "@/constants/palette";
import { Topic } from "@/services/catalog";
const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
  "Gia đình": "people-outline",
  "Đồ ăn": "restaurant-outline",
  "Động vật": "paw-outline",
  "Trường học": "school-outline",
  "Công việc": "briefcase-outline",
  "Du lịch": "airplane-outline",
  "Mua sắm": "bag-handle-outline",
  "Thời tiết": "partly-sunny-outline",
};
export function TopicCard({
  topic,
  onPress,
}: {
  topic: Topic;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [s.card, pressed && s.pressed]}
    >
      <View style={s.icon}>
        <Ionicons
          name={icons[topic.ten] || "chatbubbles-outline"}
          size={27}
          color={c.green}
        />
      </View>
      <Text style={s.title}>{topic.ten}</Text>
      <View style={s.row}>
        <Text style={s.count}>{topic.word_count} từ vựng</Text>
        <Ionicons name="arrow-forward" size={17} color={c.green} />
      </View>
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: {
    flex: 1,
    padding: 18,
    borderRadius: 22,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.line,
    gap: 12,
  },
  pressed: { opacity: 0.65 },
  icon: {
    width: 49,
    height: 49,
    borderRadius: 16,
    backgroundColor: c.soft,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, fontWeight: "700", color: c.ink },
  count: { fontSize: 12, color: c.muted },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});
