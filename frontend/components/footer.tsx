import { StyleSheet, View, TouchableOpacity, Linking } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';

export function Footer() {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';
  const borderColor = colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <ThemedView style={[styles.container, { borderTopColor: borderColor }]}>
      {/* App Info */}
      <View style={styles.section}>
        <ThemedText style={styles.appName}>English Vocabulary</ThemedText>
        <ThemedText style={styles.tagline}>
          Học từ vựng tiếng Anh qua Flashcard
        </ThemedText>
        <ThemedText style={styles.version}>Phiên bản 1.0.0</ThemedText>
      </View>

      {/* Quick Links */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Liên kết nhanh</ThemedText>
        <View style={styles.linksContainer}>
          <TouchableOpacity style={styles.link}>
            <ThemedText style={styles.linkText}>Về chúng tôi</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.link}>
            <ThemedText style={styles.linkText}>Điều khoản sử dụng</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.link}>
            <ThemedText style={styles.linkText}>Chính sách bảo mật</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.link}>
            <ThemedText style={styles.linkText}>Liên hệ hỗ trợ</ThemedText>
          </TouchableOpacity>
        </View>
      </View>

      {/* Social Links */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Kết nối với chúng tôi</ThemedText>
        <View style={styles.socialContainer}>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink('https://facebook.com')}
          >
            <Ionicons name="logo-facebook" size={24} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink('https://instagram.com')}
          >
            <Ionicons name="logo-instagram" size={24} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink('https://youtube.com')}
          >
            <Ionicons name="logo-youtube" size={24} color={iconColor} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.socialButton}
            onPress={() => openLink('mailto:support@englishvocabulary.vn')}
          >
            <Ionicons name="mail" size={24} color={iconColor} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Copyright */}
      <View style={styles.copyrightContainer}>
        <ThemedText style={styles.copyright}>
          © 2026 English Vocabulary. All rights reserved.
        </ThemedText>
        <ThemedText style={styles.copyright}>
          Made with ❤️ in Vietnam
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    gap: 24,
  },
  section: {
    gap: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#007AFF',
  },
  tagline: {
    fontSize: 14,
    opacity: 0.7,
  },
  version: {
    fontSize: 12,
    opacity: 0.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  linksContainer: {
    gap: 8,
  },
  link: {
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 14,
    opacity: 0.8,
  },
  socialContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  socialButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copyrightContainer: {
    gap: 4,
    alignItems: 'center',
    paddingTop: 16,
  },
  copyright: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'center',
  },
});
