import { Footer } from '@/components/footer';
import { Header } from '@/components/header';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';
  
  // TODO: Replace with actual auth state from context/store
  const [isLoggedIn] = useState(false);
  const [userName] = useState('Người dùng');

  return (
    <ThemedView style={styles.container}>
      {/* Header */}
      <Header 
        title="Trang chủ"
        rightElement={
          isLoggedIn ? (
            <Link href="/login" asChild>
              <TouchableOpacity>
                <Ionicons name="person-circle" size={28} color={iconColor} />
              </TouchableOpacity>
            </Link>
          ) : (
            <View style={styles.authHeaderButtons}>
              <Link href="/login" asChild>
                <TouchableOpacity style={styles.headerLoginBtn}>
                  <ThemedText style={styles.headerLoginText}>Đăng nhập</ThemedText>
                </TouchableOpacity>
              </Link>
              <Link href="/register" asChild>
                <TouchableOpacity style={styles.headerRegisterBtn}>
                  <ThemedText style={styles.headerRegisterText}>Đăng ký</ThemedText>
                </TouchableOpacity>
              </Link>
            </View>
          )
        }
      />

      {/* Content */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.content}>
          {/* Greeting Section */}
          <View style={styles.greetingSection}>
            <ThemedText type="title" style={styles.greeting}>
              {isLoggedIn ? `Xin chào, ${userName}! 👋` : 'Xin chào 👋'}
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              {isLoggedIn 
                ? 'Tiếp tục hành trình học từ vựng của bạn' 
                : 'Đăng nhập để lưu tiến độ học tập'}
            </ThemedText>
          </View>

          {/* Quick Start Button */}
          <TouchableOpacity style={styles.startButton}>
            <Ionicons name="play-circle" size={24} color="#fff" style={styles.startButtonIcon} />
            <ThemedText style={styles.startButtonText}>
              {isLoggedIn ? 'Tiếp tục học' : 'Học thử không cần đăng ký'}
            </ThemedText>
          </TouchableOpacity>

          {/* Daily Progress - Only show when logged in */}
          {isLoggedIn && (
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
          )}

          {/* Popular Topics */}
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Chủ đề phổ biến
            </ThemedText>
            <View style={styles.topicsGrid}>
              {['Giao tiếp', 'Gia đình', 'Đồ ăn', 'Trường học'].map((topic) => (
                <TouchableOpacity key={topic} style={styles.topicCard}>
                  <Ionicons name="book-outline" size={24} color="#007AFF" style={styles.topicIcon} />
                  <ThemedText style={styles.topicText}>{topic}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Review Section - Only show when logged in and has words to review */}
          {isLoggedIn && (
            <View style={styles.card}>
              <View style={styles.reviewHeader}>
                <Ionicons name="refresh-circle" size={24} color="#34C759" />
                <ThemedText type="subtitle" style={styles.cardTitle}>
                  Ôn tập
                </ThemedText>
              </View>
              <ThemedText style={styles.reviewText}>
                Bạn có 5 từ cần ôn lại.
              </ThemedText>
              <TouchableOpacity style={styles.reviewButton}>
                <ThemedText style={styles.reviewButtonText}>
                  Ôn tập ngay
                </ThemedText>
              </TouchableOpacity>
            </View>
          )}

          {/* Guest Mode Info - Only show when NOT logged in */}
          {!isLoggedIn && (
            <View style={styles.infoCard}>
              <Ionicons name="information-circle" size={24} color="#007AFF" />
              <View style={styles.infoContent}>
                <ThemedText style={styles.infoTitle}>
                  Học thử miễn phí
                </ThemedText>
                <ThemedText style={styles.infoText}>
                  Bạn có thể học thử mà không cần đăng nhập. Tuy nhiên, tiến độ học tập sẽ không được lưu lại.
                </ThemedText>
              </View>
            </View>
          )}

          {/* Footer */}
          <Footer />
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
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
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
  authHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerLoginBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  headerLoginText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
  },
  headerRegisterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF',
  },
  headerRegisterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  authButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  loginBtn: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  registerBtn: {
    flex: 1,
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  registerBtnText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  startButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  startButtonIcon: {
    marginRight: 4,
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
    flexBasis: '48%',
    flexGrow: 0,
    flexShrink: 0,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    gap: 8,
  },
  topicIcon: {
    marginBottom: 4,
  },
  topicText: {
    fontSize: 14,
    fontWeight: '600',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  infoCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    gap: 12,
    alignItems: 'flex-start',
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    opacity: 0.7,
    lineHeight: 20,
  },
});
