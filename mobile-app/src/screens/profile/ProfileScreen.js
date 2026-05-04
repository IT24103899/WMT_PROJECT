import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, Image, Dimensions, Platform
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { updateProfile, changePassword, uploadAvatar } from '../../services/api';
import { API_BASE_URL } from '../../config/api';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';


const { width } = Dimensions.get('window');

export default function ProfileScreen({ navigation }) {
  const { user, logout, refreshUser } = useAuth();
  const { colors, dark } = useTheme();

  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [savingPwd, setSavingPwd] = useState(false);
  const [pwdErrors, setPwdErrors] = useState({});
  const [imgError, setImgError] = useState(false);
  const [profileVersion, setProfileVersion] = useState(Date.now());

  // Reset error and update version when user image changes
  React.useEffect(() => {
    setImgError(false);
    setProfileVersion(Date.now());
  }, [user?.profileImage]);

  // Construct the full image URL
  const getServerUrl = () => {
    // Ensure no trailing slash on base, and prefix has leading slash
    return API_BASE_URL.replace('/api/', '').replace(/\/$/, '');
  };
  
  const profileImageUrl = user?.profileImage 
    ? `${getServerUrl()}/${user.profileImage.replace(/^\//, '')}?v=${profileVersion}` 
    : null;

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      handleUploadImage(result.assets[0]);
    }
  };

  const handleUploadImage = async (imageAsset) => {
    setUploading(true);
    try {
      const formData = new FormData();
      
      if (Platform.OS === 'web') {
        // For Web, fetch the blob from the local URI
        const response = await fetch(imageAsset.uri);
        const blob = await response.blob();
        formData.append('avatar', blob, 'profile.jpg');
      } else {
        // For Mobile, use the standard RN object structure
        const uri = imageAsset.uri;
        const filename = uri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename || '');
        const fileType = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('avatar', {
          uri: Platform.OS === 'android' ? uri : uri.replace('file://', ''),
          name: filename || 'profile.jpg',
          type: imageAsset.mimeType || fileType,
        });
      }

      await uploadAvatar(formData);
      await refreshUser();
      Alert.alert('Success', 'Profile picture updated!');
    } catch (err) {
      console.error('[UPLOAD_ERROR]', err);
      const msg = err.response?.data?.message || err.message || 'Unknown error';
      Alert.alert('Upload Failed', `Could not upload image: ${msg}`);
    } finally {
      setUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!newName.trim()) { Alert.alert('Error', 'Name cannot be empty'); return; }
    setSavingName(true);
    try {
      await updateProfile({ name: newName.trim() });
      await refreshUser();
      setEditingName(false);
      Alert.alert('Success', 'Display name updated!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const validatePwd = () => {
    const e = {};
    if (!currentPassword) e.current = 'Current password is required';
    if (!newPassword) e.new = 'New password is required';
    else if (newPassword.length < 6) e.new = 'Minimum 6 characters';
    setPwdErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePwd()) return;
    setSavingPwd(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      Alert.alert('Success', 'Password changed successfully!');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Current password is incorrect');
    } finally {
      setSavingPwd(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Unknown';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={dark ? ['#020617', '#1e1b4b'] : ['#1e1b4b', '#4338ca']} style={styles.headerBackground}>
        <View style={styles.headerAccent} />
      </LinearGradient>


      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Avatar Area */}
        <View style={styles.avatarWrapper}>
          <TouchableOpacity 
            onPress={handlePickImage} 
            activeOpacity={0.9} 
            disabled={uploading}
            style={[styles.avatarContainer, { backgroundColor: colors.surface, borderColor: colors.surface }]}
          >
            {profileImageUrl && !imgError ? (
              <Image 
                source={{ uri: profileImageUrl }} 
                style={styles.avatarImage} 
                onError={() => setImgError(true)}
              />
            ) : (
              <LinearGradient colors={dark ? ['#312e81', '#4338ca'] : ['#4f46e5', '#6366f1']} style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>{(user?.name || 'U').charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            <View style={styles.editBadge}>
              {uploading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          <Text style={[styles.userName, { color: colors.text }]}>{user?.name}</Text>
          <View style={[styles.roleTag, { backgroundColor: dark ? 'rgba(129, 140, 248, 0.1)' : '#eef2ff' }]}>
             <Ionicons name={user?.role === 'admin' ? "shield-checkmark" : (user?.isPremium ? "star" : "book")} size={14} color={colors.primary} />
             <Text style={[styles.roleText, { color: colors.primary }]}>{user?.role === 'admin' ? 'Administrator' : (user?.isPremium ? 'Premium Reader' : 'Basic Reader')}</Text>
          </View>

        </View>

        {/* Profile Details Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : '#475569' }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="person-circle-outline" size={20} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Account Details</Text>
          </View>


          <View style={styles.infoRow}>
            <View>
              <Text style={styles.label}>Display Name</Text>
              {editingName ? (
                <TextInput 
                  style={[styles.nameInput, { color: colors.primary, borderBottomColor: colors.primary }]} 
                  value={newName} 
                  onChangeText={setNewName} 
                  autoFocus
                />
              ) : (
                <Text style={[styles.value, { color: colors.text }]}>{user?.name}</Text>
              )}
            </View>

            <TouchableOpacity 
              onPress={() => editingName ? handleSaveName() : setEditingName(true)}
              style={editingName ? [styles.saveBadge, { backgroundColor: colors.primary }] : [styles.editBadgeSmall, { borderColor: colors.border }]}
            >
              {savingName ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={editingName ? styles.saveBadgeText : [styles.editBadgeText, { color: colors.textSecondary }]}>
                  {editingName ? 'Save' : 'Edit'}
                </Text>
              )}
            </TouchableOpacity>

          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
 
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.label}>Email Address</Text>
              <Text style={[styles.value, { color: colors.text }]}>{user?.email}</Text>
            </View>
            <Ionicons name="mail-outline" size={18} color={colors.textSecondary} />
          </View>


          <View style={[styles.divider, { backgroundColor: colors.border }]} />
 
          <View style={styles.infoRow}>
            <View>
              <Text style={styles.label}>Joined Since</Text>
              <Text style={[styles.value, { color: colors.text }]}>{joinDate}</Text>
            </View>
            <Ionicons name="calendar-outline" size={18} color={colors.textSecondary} />
          </View>
        </View>

        {/* Password Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : '#475569' }]}>
            <View style={styles.cardHeader}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.primary} />
                <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>Security</Text>
            </View>
            
            <View style={styles.inputWrap}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Current Password</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: dark ? colors.background : '#f8fafc', color: colors.text, borderColor: colors.border }, pwdErrors.current && styles.inputError]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textSecondary}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                />
                {pwdErrors.current && <Text style={styles.errorMsg}>{pwdErrors.current}</Text>}
            </View>


            <View style={styles.inputWrap}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>New Password</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: dark ? colors.background : '#f8fafc', color: colors.text, borderColor: colors.border }, pwdErrors.new && styles.inputError]}
                    placeholder="min. 6 characters"
                    placeholderTextColor={colors.textSecondary}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                />
                {pwdErrors.new && <Text style={styles.errorMsg}>{pwdErrors.new}</Text>}
            </View>
 
            <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.primary, shadowColor: colors.primary }]} onPress={handleChangePassword} disabled={savingPwd}>
                {savingPwd ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Update Password</Text>}
            </TouchableOpacity>
        </View>

        {/* Logout Card */}
        <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : '#475569' }]}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <View style={styles.menuItemLeft}>
              <Ionicons name="log-out-outline" size={22} color={colors.error} />
              <Text style={[styles.menuItemText, { color: colors.error }]}>Sign Out from Account</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>


          {/* Extra Options — Only for regular users, Admins have their own management tab */}
          {user?.role !== 'admin' && (
            <View style={[styles.card, { backgroundColor: colors.surface, shadowColor: dark ? '#000' : '#475569' }]}>
               <View style={styles.cardHeader}>
                 <Ionicons name="options-outline" size={20} color={colors.primary} />
                 <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>More Options</Text>
               </View>
               
               <TouchableOpacity 
                 style={styles.menuItem} 
                 onPress={() => navigation.navigate('Payment')}
               >
                 <View style={styles.menuItemLeft}>
                   <Ionicons name="star-outline" size={22} color={colors.text} />
                   <Text style={[styles.menuItemText, { color: colors.text }]}>Premium Subscription</Text>
                 </View>
                 <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
               </TouchableOpacity>
               
               <View style={[styles.divider, { backgroundColor: colors.border }]} />

               <TouchableOpacity 
                 style={styles.menuItem} 
                 onPress={() => navigation.navigate('Feedback')}
               >
                 <View style={styles.menuItemLeft}>
                   <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.text} />
                   <Text style={[styles.menuItemText, { color: colors.text }]}>Send Feedback</Text>
                 </View>
                 <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
               </TouchableOpacity>
            </View>
          )}




      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBackground: { height: 180, position: 'absolute', top: 0, left: 0, right: 0 },
  headerAccent: { position: 'absolute', bottom: -50, right: -20, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,255,255,0.05)' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },
  avatarWrapper: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { 
    width: 110, height: 110, borderRadius: 55, 
    borderWidth: 4, borderColor: '#fff', 
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
    backgroundColor: '#fff', position: 'relative'
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 55 },
  avatarPlaceholder: { flex: 1, borderRadius: 55, justifyContent: 'center', alignItems: 'center' },
  avatarLetter: { fontSize: 44, fontWeight: 'bold', color: '#fff' },
  editBadge: { 
    position: 'absolute', bottom: 0, right: 0, 
    width: 32, height: 32, borderRadius: 16, 
    backgroundColor: '#4338ca', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#fff'
  },
  userName: { fontSize: 24, fontWeight: '900', color: '#1e293b', marginTop: 15 },
  roleTag: { flexDirection: 'row', alignItems: 'center', marginTop: 6, backgroundColor: '#eef2ff', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
  roleText: { marginLeft: 6, fontSize: 13, color: '#4338ca', fontWeight: '700' },
  
  card: { borderRadius: 24, padding: 20, marginBottom: 20, shadowOpacity: 0.05, shadowRadius: 15, elevation: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: '800', marginLeft: 10 },

  
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 12, color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  value: { fontSize: 15, color: '#1e293b', fontWeight: '700' },
  nameInput: { fontSize: 15, color: '#4338ca', fontWeight: '700', padding: 0, borderBottomWidth: 1, borderBottomColor: '#4338ca', minWidth: 150 },
  editBadgeSmall: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWeight: 1, borderColor: '#e2e8f0', borderWidth: 1 },
  editBadgeText: { fontSize: 12, color: '#64748b', fontWeight: '700' },
  saveBadge: { backgroundColor: '#4338ca', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  saveBadgeText: { fontSize: 12, color: '#fff', fontWeight: '700' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 15 },
  
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center' },
  menuItemText: { marginLeft: 12, fontSize: 15, fontWeight: '600', color: '#475569' },

  inputWrap: { marginBottom: 15 },
  fieldLabel: { fontSize: 13, fontWeight: '700', color: '#64748b', marginBottom: 8, marginLeft: 4 },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, color: '#1e293b', borderWidth: 1, borderColor: '#e2e8f0' },
  inputError: { borderColor: '#ef4444' },
  errorMsg: { color: '#ef4444', fontSize: 12, marginTop: 4, marginLeft: 4 },
  primaryBtn: { backgroundColor: '#4338ca', borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginTop: 10, shadowColor: '#4338ca', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 15 },
  logoutBtnText: { marginLeft: 10, fontSize: 16, fontWeight: '700', color: '#ef4444' },


});
