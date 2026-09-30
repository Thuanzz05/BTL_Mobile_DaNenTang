import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { palette as c } from "@/constants/palette";
import { Topic } from "@/services/catalog";

const icons: Record<string, keyof typeof Feather.glyphMap> = {
  "Giao tiếp hàng ngày": "message-circle",
  "Gia đình": "users",
  "Đồ ăn": "coffee",
  "Động vật": "feather",
  "Trường học": "book-open",
  "Công việc": "briefcase",
  "Du lịch": "map",
  "Mua sắm": "shopping-bag",
  "Thời tiết": "cloud",
  "Nhà cửa": "home",
  "Quần áo": "tag",
  "Cơ thể và sức khỏe": "activity",
  "Thể thao": "target",
  "Công nghệ": "monitor",
  "Giao thông": "navigation",
  "Thiên nhiên": "sun",
  "Cảm xúc và tính cách": "smile",
  "Thời gian và lịch": "clock",
  "Hoạt động hằng ngày": "repeat",
  "Nghệ thuật và giải trí": "music",
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
      <Feather
        name={icons[topic.ten] || "book"}
        size={19}
        color={c.rust}
        style={s.icon}
      />
      <View style={s.copy}>
        <Text style={s.title}>{topic.ten}</Text>
        <Text style={s.count}>{topic.word_count} từ vựng</Text>
      </View>
      <Feather name="chevron-right" size={18} color={c.muted} />
    </Pressable>
  );
}
const s = StyleSheet.create({
  card: {
    paddingVertical: 15,
    paddingHorizontal: 12,
    backgroundColor: c.surface,
    borderBottomWidth: 1,
    borderBottomColor: c.line,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pressed: { opacity: 0.65 },
  icon: { width: 30, textAlign: "center" },
  copy: { flex: 1, gap: 3 },
  title: { fontSize: 16, fontWeight: "700", color: c.ink },
  count: { fontSize: 12, color: c.muted },
});
