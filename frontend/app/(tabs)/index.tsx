import { Header } from '@/components/header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header 
        title="Trang chủ"
        rightElement={
          <TouchableOpacity>
            <Ionicons name="notifications-outline" size={24} color={iconColor} />
          </TouchableOpacity>
        }
      />

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <ThemedText type="title" style={styles.greeting}>
              Xin chào, Thuấn 👋
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              Hôm nay bạn muốn học gì?
            </ThemedText>
          </View>

          {/* Quick Start Button */}
          <TouchableOpacity style={styles.startButton}>
            <ThemedText style={styles.startButtonText}>
              Bắt đầu học
            </ThemedText>
          </TouchableOpacity>

          {/* Daily Progress */}
          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Tiến độ hôm nay
            </ThemedText>
            <View style={styles.progressInfo}>
              <ThemedText style={styles.progressText}>12 / 20 từ</ThemedText>
              <ThemedText style={styles.progressPercent}>60%</ThemedText>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
          </View>

          {/* Popular Topics */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Chủ đề phổ biến
            </ThemedText>
            <View style={styles.topicsGrid}>
              {['Giao tiếp', 'Gia đình', 'Đồ ăn', 'Trường học'].map((topic) => (
                <TouchableOpacity key={topic} style={styles.topicCard}>
                  <ThemedText style={styles.topicText}>{topic}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Review Section */}
          <View style={styles.card}>
            <ThemedText type="subtitle" style={styles.cardTitle}>
              Ôn tập
            </ThemedText>
            <ThemedText style={styles.reviewText}>
              Bạn có 5 từ cần ôn lại.
            </ThemedText>
            <TouchableOpacity style={styles.reviewButton}>
              <ThemedText style={styles.reviewButtonText}>
                Ôn tập ngay
              </ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 20,
  },
  greetingSection: {
    marginTop: 8,
    gap: 4,
  },
  greeting: {
    fontSize: 28,
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.7,
  },
  startButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
  },
  topicsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topicCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewText: {
    fontSize: 14,
    opacity: 0.8,
  },
  reviewButton: {
    backgroundColor: '#34C759',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  reviewButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
