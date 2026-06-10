/**
 * SignatureModal.tsx
 *
 * Two-tab modal for capturing a signature:
 *   1. Draw  — touchscreen canvas via react-native-signature-canvas
 *   2. Upload — pick an image from the gallery (expo-image-picker)
 *
 * Returns a base64 data URL (data:image/png;base64,...) via onConfirm.
 * This is the same format V1 backend expects for signature_data_url.
 */

import * as ImagePicker from "expo-image-picker";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import SignatureCanvas from "react-native-signature-canvas";

import { colors, spacing, typography } from "@/theme/tokens";

type Tab = "draw" | "upload";

type Props = {
  visible: boolean;
  onConfirm: (dataUrl: string) => void;
  onClose: () => void;
};

export function SignatureModal({ visible, onConfirm, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("draw");
  const [uploadedUri, setUploadedUri] = useState<string | null>(null);
  const [uploadedDataUrl, setUploadedDataUrl] = useState<string | null>(null);
  const [canvasReady, setCanvasReady] = useState(false);
  const sigRef = useRef<SignatureCanvas>(null);

  function handleClear() {
    if (tab === "draw") {
      sigRef.current?.clearSignature();
    } else {
      setUploadedUri(null);
      setUploadedDataUrl(null);
    }
  }

  function handleConfirmDraw() {
    // Triggers onOK with the base64 data URL
    sigRef.current?.readSignature();
  }

  function handleDrawOK(dataUrl: string) {
    if (!dataUrl || dataUrl === "data:,") return;
    onConfirm(dataUrl);
    onClose();
    resetState();
  }

  function handleDrawEmpty() {
    // Nothing drawn — do nothing
  }

  async function handlePickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    setUploadedUri(asset.uri);
    if (asset.base64) {
      const mime = asset.mimeType ?? "image/jpeg";
      setUploadedDataUrl(`data:${mime};base64,${asset.base64}`);
    }
  }

  function handleConfirmUpload() {
    if (!uploadedDataUrl) return;
    onConfirm(uploadedDataUrl);
    onClose();
    resetState();
  }

  function handleClose() {
    onClose();
    resetState();
  }

  function resetState() {
    setUploadedUri(null);
    setUploadedDataUrl(null);
    setCanvasReady(false);
    sigRef.current?.clearSignature();
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={handleClose}
      presentationStyle="pageSheet"
      transparent={false}
      visible={visible}
    >
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Signature</Text>
          <Pressable accessibilityRole="button" onPress={handleClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>Cancel</Text>
          </Pressable>
        </View>

        {/* Tab switcher */}
        <View style={styles.tabBar}>
          {(["draw", "upload"] as const).map((t) => (
            <Pressable
              accessibilityRole="tab"
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t ? styles.tabActive : null]}
            >
              <Text style={[styles.tabText, tab === t ? styles.tabTextActive : null]}>
                {t === "draw" ? "Draw" : "Upload Image"}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Draw tab */}
        {tab === "draw" ? (
          <View style={styles.drawArea}>
            <Text style={styles.hint}>Sign in the box below</Text>
            <View style={styles.canvasWrapper}>
              {!canvasReady ? (
                <View style={styles.canvasLoading}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={styles.loadingText}>Loading canvas…</Text>
                </View>
              ) : null}
              <SignatureCanvas
                ref={sigRef}
                onOK={handleDrawOK}
                onEmpty={handleDrawEmpty}
                onBegin={() => setCanvasReady(true)}
                webStyle={webStyle}
                autoClear={false}
                descriptionText=""
                clearText="Clear"
                confirmText="Confirm"
              />
            </View>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={handleClear} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={handleConfirmDraw} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Use Signature</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Upload tab */
          <View style={styles.uploadArea}>
            <Text style={styles.hint}>Pick a signature image from your gallery</Text>
            {uploadedUri ? (
              <View style={styles.uploadPreview}>
                <Image
                  source={{ uri: uploadedUri }}
                  style={styles.uploadImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => void handlePickImage()}
                style={styles.pickBtn}
              >
                <Text style={styles.pickBtnText}>+ Choose from Gallery</Text>
              </Pressable>
            )}
            {uploadedUri ? (
              <View style={styles.actions}>
                <Pressable accessibilityRole="button" onPress={handleClear} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Change</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleConfirmUpload}
                  style={styles.confirmBtn}
                >
                  <Text style={styles.confirmBtnText}>Use Signature</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Modal>
  );
}

const webStyle = `
  .m-signature-pad { box-shadow: none; border: none; }
  .m-signature-pad--body { border: none; }
  .m-signature-pad--footer { display: none; }
`;

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.background ?? "#ffffff",
  },
  header: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: typography.title ?? 20,
    fontWeight: "900",
  },
  closeBtn: {
    padding: spacing.xs,
  },
  closeBtnText: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: "700",
  },
  tabBar: {
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    gap: 4,
    margin: spacing.lg,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    alignItems: "center",
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900",
  },
  tabTextActive: {
    color: colors.onPrimary ?? "#ffffff",
  },
  hint: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  drawArea: {
    gap: spacing.md,
  },
  canvasWrapper: {
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 160,
    marginHorizontal: spacing.lg,
    overflow: "hidden",
  },
  canvasLoading: {
    alignItems: "center",
    bottom: 0,
    gap: 6,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
  },
  uploadArea: {
    flex: 1,
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  uploadPreview: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 160,
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    overflow: "hidden",
  },
  uploadImage: {
    height: "100%",
    width: "100%",
  },
  pickBtn: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderStyle: "dashed",
    borderWidth: 1,
    justifyContent: "center",
    marginHorizontal: spacing.lg,
    minHeight: 120,
  },
  pickBtnText: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl ?? 32,
  },
  clearBtn: {
    alignItems: "center",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flex: 1,
    justifyContent: "center",
    minHeight: 48,
  },
  clearBtnText: {
    color: colors.muted,
    fontSize: typography.body,
    fontWeight: "900",
  },
  confirmBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    flex: 2,
    justifyContent: "center",
    minHeight: 48,
  },
  confirmBtnText: {
    color: colors.onPrimary ?? "#ffffff",
    fontSize: typography.body,
    fontWeight: "900",
  },
});
