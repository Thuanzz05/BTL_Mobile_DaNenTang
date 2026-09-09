import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

interface HeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightElement?: React.ReactNode;
}

export function Header({ 
  title = 'English Vocabulary', 
  showBackButton = false,
  onBackPress,
  rightElement 
}: HeaderProps) {
  const colorScheme = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        {/* Left side - Back button or placeholder */}
        <View style={styles.leftSection}>
          {showBackButton && onBackPress ? (
            <TouchableOpacity onPress={onBackPress} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={iconColor} />
            </TouchableOpacity>
          ) : (
            <View style={styles.placeholder} />
          )}
        </View>

        {/* Center - Title */}
        <View style={styles.centerSection}>
          <ThemedText type="subtitle" style={styles.title}>
            {title}
          </ThemedText>
        </View>

        {/* Right side - Optional element */}
        <View style={styles.rightSection}>
          {rightElement || <View style={styles.placeholder} />}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    minWidth: 120,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  backButton: {
    padding: 4,
  },
  placeholder: {
    width: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
});
