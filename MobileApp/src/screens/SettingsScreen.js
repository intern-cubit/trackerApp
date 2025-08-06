import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useSelector } from 'react-redux';

const SettingsScreen = () => {
  const { signOut } = useAuth();
  const { user } = useSelector(state => state.auth);

  // Helper function to get display name
  const getDisplayName = (user) => {
    console.log('User object:', user); // Debug log
    if (user.name) return user.name;
    if (user.displayName) return user.displayName;
    if (user.username) return user.username;
    if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
    if (user.firstName) return user.firstName;
    if (user.email) {
      // Extract name from email (part before @)
      const emailName = user.email.split('@')[0];
      // Capitalize first letter and replace dots/underscores with spaces
      return emailName.charAt(0).toUpperCase() + emailName.slice(1).replace(/[._]/g, ' ');
    }
    return 'User';
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const SettingItem = ({ title, subtitle, icon, onPress, showArrow = true, critical = false }) => (
    <TouchableOpacity style={[styles.settingItem, critical && styles.criticalItem]} onPress={onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.settingIcon, critical && styles.criticalIcon]}>
          <Ionicons name={icon} size={24} color={critical ? "#d63031" : "#00b894"} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, critical && styles.criticalText]}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      {showArrow && (
        <Ionicons name="chevron-forward" size={20} color="#b2bec3" />
      )}
    </TouchableOpacity>
  );

  const handleNotImplemented = () => {
    Alert.alert('Coming Soon', 'This feature will be available in a future update.');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>⚙️ Settings</Text>
            <Text style={styles.subtitle}>Manage your preferences</Text>
          </View>
          
          {user && (
            <View style={styles.section}>
              <View style={styles.profileCard}>
                <View style={styles.profileAvatar}>
                  <Ionicons name="person" size={32} color="#667eea" />
                </View>
                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {getDisplayName(user)}
                  </Text>
                  <Text style={styles.profileEmail}>{user.email}</Text>
                </View>
                <View style={styles.profileBadge}>
                  <Text style={styles.profileBadgeText}>Pro</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📍 Tracking</Text>
            <SettingItem
              title="Location Settings"
              subtitle="Manage GPS and location preferences"
              icon="location"
              onPress={handleNotImplemented}
            />
            <SettingItem
              title="Auto Tracking"
              subtitle="Enable automatic location tracking"
              icon="play-circle"
              onPress={handleNotImplemented}
            />
            <SettingItem
              title="Tracking History"
              subtitle="View and manage location history"
              icon="time"
              onPress={handleNotImplemented}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔐 Security</Text>
            <SettingItem
              title="Security Settings"
              subtitle="Configure security features"
              icon="shield"
              onPress={handleNotImplemented}
            />
            <SettingItem
              title="Geofences"
              subtitle="Manage geofence alerts"
              icon="location-outline"
              onPress={handleNotImplemented}
            />
            <SettingItem
              title="Emergency Contacts"
              subtitle="Set up emergency contacts"
              icon="call"
              onPress={handleNotImplemented}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔒 Privacy</Text>
            <SettingItem
              title="Data Privacy"
              subtitle="Manage your data and privacy settings"
              icon="lock-closed"
              onPress={handleNotImplemented}
            />
            <SettingItem
              title="Permissions"
              subtitle="App permissions and access"
              icon="key"
              onPress={handleNotImplemented}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📞 Support</Text>
            <SettingItem
              title="Help & Support"
              subtitle="Get help and contact support"
              icon="help-circle"
              onPress={handleNotImplemented}
            />
            <SettingItem
              title="About"
              subtitle="App version and information"
              icon="information-circle"
              onPress={handleNotImplemented}
            />
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <View style={styles.signOutIcon}>
                <Ionicons name="log-out" size={24} color="#d63031" />
              </View>
              <Text style={styles.signOutText}>Sign Out</Text>
              <Ionicons name="chevron-forward" size={20} color="#d63031" />
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              🔒 TrackerApp v2.0
            </Text>
            <Text style={styles.footerSubtext}>
              Secure Location Tracking & Enhanced Security
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 32,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#636e72',
    textAlign: 'center',
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 18,
    paddingLeft: 4,
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  profileAvatar: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2d3436',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  profileEmail: {
    fontSize: 14,
    color: '#636e72',
    fontWeight: '500',
  },
  profileBadge: {
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  profileBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  settingItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  criticalItem: {
    borderColor: 'rgba(214, 48, 49, 0.2)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  criticalIcon: {
    backgroundColor: 'rgba(214, 48, 49, 0.1)',
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 2,
  },
  criticalText: {
    color: '#d63031',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#636e72',
    lineHeight: 20,
  },
  signOutButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(214, 48, 49, 0.2)',
  },
  signOutIcon: {
    width: 50,
    height: 50,
    backgroundColor: 'rgba(214, 48, 49, 0.1)',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 18,
  },
  signOutText: {
    color: '#d63031',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingBottom: 48,
    paddingHorizontal: 8,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2d3436',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
    color: '#636e72',
    textAlign: 'center',
  },
});

export default SettingsScreen;
