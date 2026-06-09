import React from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

type Props = {
  value: string | null;
  onChange: (uri: string | null) => void;
};

async function pickFromCamera(): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission required", "Camera access is needed to take a photo.");
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: false,
  });
  if (!result.canceled && result.assets[0]) return result.assets[0].uri;
  return null;
}

async function pickFromGallery(): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) {
    Alert.alert("Permission required", "Photo library access is needed.");
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    quality: 0.8,
    allowsEditing: false,
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
  });
  if (!result.canceled && result.assets[0]) return result.assets[0].uri;
  return null;
}

export function ReceiptPickerField({ value, onChange }: Props) {
  function handlePress() {
    if (Platform.OS === "web") {
      pickFromGallery().then((uri) => { if (uri) onChange(uri); });
      return;
    }
    Alert.alert("Attach Receipt", "Choose a source", [
      { text: "📷 Camera",       onPress: () => pickFromCamera().then((uri)  => { if (uri) onChange(uri); }) },
      { text: "🖼  Photo Library", onPress: () => pickFromGallery().then((uri) => { if (uri) onChange(uri); }) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  if (value) {
    return (
      <View style={styles.preview}>
        <Image source={{ uri: value }} style={styles.thumb} resizeMode="cover" />
        <View style={styles.previewInfo}>
          <Text style={styles.attachedLabel}>📎 Receipt attached</Text>
          <View style={styles.previewActions}>
            <Pressable onPress={handlePress} style={styles.changeBtn}>
              <Text style={styles.changeBtnText}>Change</Text>
            </Pressable>
            <Pressable onPress={() => onChange(null)} style={styles.removeBtn}>
              <Text style={styles.removeBtnText}>Remove</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={handlePress} style={styles.emptyBtn}>
      <Text style={styles.emptyIcon}>📎</Text>
      <Text style={styles.emptyText}>Attach Receipt</Text>
      <Text style={styles.emptyHint}>optional</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    backgroundColor: "#f8fafc",
  },
  emptyIcon: { fontSize: 18 },
  emptyText: { fontSize: 14, color: "#475569", fontWeight: "600", flex: 1 },
  emptyHint: { fontSize: 12, color: "#94a3b8" },
  preview: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  thumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  previewInfo: { flex: 1, gap: 8 },
  attachedLabel: { fontSize: 13, color: "#16a34a", fontWeight: "700" },
  previewActions: { flexDirection: "row", gap: 10 },
  changeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: "#e0f2fe", borderWidth: 1, borderColor: "#bae6fd" },
  changeBtnText: { fontSize: 12, color: "#0369a1", fontWeight: "700" },
  removeBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fecaca" },
  removeBtnText: { fontSize: 12, color: "#dc2626", fontWeight: "700" },
});
