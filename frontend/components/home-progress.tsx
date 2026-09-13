import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAuth } from "@/contexts/auth-context";
import { palette as c } from "@/constants/palette";
interface Dashboard {
  tien_do_hom_nay: { da_hoc: number; muc_tieu: number };
  so_tu_can_on: number;
  tien_do: { tong_so_tu_da_hoc: number };
}
export function HomeProgress() {
  const { client, user } = useAuth();
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    client
      .authorized<Dashboard>("/home/dashboard")
      .then((value) => {
        if (active) setData(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [client, attempt]);
  const today = data?.tien_do_hom_nay;
  const progress = today
    ? Math.min(
        100,
        Math.max(0, (today.da_hoc / Math.max(today.muc_tieu, 1)) * 100),
      )
    : 0;
  const fill = StyleSheet.create({ value: { width: `${progress}%` } });
  return (
    <View style={s.card}>
      <Text style={s.title}>Xin chào, {user?.ho_ten}!</Text>
      <Text style={s.body}>Tiến độ học tập của bạn hôm nay</Text>
      {error ? (
        <>
          <Text accessibilityRole="alert" style={s.body}>
            {error}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={s.retry}
            onPress={() => {
              setError("");
              setAttempt((v) => v + 1);
            }}
          >
            <Text style={s.link}>Thử lại</Text>
          </Pressable>
        </>
      ) : !data ? (
        <ActivityIndicator color={c.green} />
      ) : (
        <>
          <View style={s.row}>
            <Text style={s.number}>
              {today?.da_hoc} / {today?.muc_tieu} từ
            </Text>
            <Text style={s.link}>{Math.round(progress)}%</Text>
          </View>
          <View
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: progress }}
            style={s.track}
          >
            <View style={[s.fill, fill.value]} />
          </View>
          <View style={s.row}>
            <Text style={s.body}>
              {data.tien_do.tong_so_tu_da_hoc} từ đã học
            </Text>
            <Text style={s.body}>{data.so_tu_can_on} từ đến hạn ôn</Text>
          </View>
        </>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: c.surface,
    padding: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: c.line,
    gap: 12,
  },
  title: { color: c.ink, fontSize: 20, fontWeight: "700" },
  body: { color: c.muted, fontSize: 14, lineHeight: 22 },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  number: { fontSize: 19, fontWeight: "700", color: c.ink },
  link: { color: c.green, fontWeight: "700" },
  track: {
    height: 8,
    backgroundColor: c.soft,
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: { height: "100%", backgroundColor: c.green, borderRadius: 4 },
  retry: { minHeight: 44, justifyContent: "center" },
});
