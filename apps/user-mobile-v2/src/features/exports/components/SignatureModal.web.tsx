/**
 * SignatureModal.web.tsx
 *
 * Web replacement for SignatureModal.tsx.
 * Uses an HTML5 <canvas> for drawing instead of react-native-signature-canvas
 * (which wraps a WebView and cannot be nested on web).
 *
 * Metro resolves this file on web builds automatically.
 */

import * as ImagePicker from "expo-image-picker";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);

  // Set up canvas drawing events
  useEffect(() => {
    if (!visible || tab !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function getPos(e: MouseEvent | TouchEvent) {
      const rect = canvas!.getBoundingClientRect();
      if ("touches" in e) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function onStart(e: MouseEvent | TouchEvent) {
      e.preventDefault();
      isDrawingRef.current = true;
      const { x, y } = getPos(e);
      ctx!.beginPath();
      ctx!.moveTo(x, y);
    }

    function onMove(e: MouseEvent | TouchEvent) {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx!.lineTo(x, y);
      ctx!.stroke();
    }

    function onEnd() {
      isDrawingRef.current = false;
    }

    canvas.addEventListener("mousedown", onStart);
    canvas.addEventListener("mousemove", onMove);
    canvas.addEventListener("mouseup", onEnd);
    canvas.addEventListener("touchstart", onStart, { passive: false });
    canvas.addEventListener("touchmove", onMove, { passive: false });
    canvas.addEventListener("touchend", onEnd);

    return () => {
      canvas.removeEventListener("mousedown", onStart);
      canvas.removeEventListener("mousemove", onMove);
      canvas.removeEventListener("mouseup", onEnd);
      canvas.removeEventListener("touchstart", onStart);
      canvas.removeEventListener("touchmove", onMove);
      canvas.removeEventListener("touchend", onEnd);
    };
  }, [visible, tab]);

  function handleClearCanvas() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function handleConfirmDraw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    if (!dataUrl || dataUrl === "data:,") return;
    onConfirm(dataUrl);
    onClose();
    resetState();
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
    handleClearCanvas();
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
              {/* @ts-ignore — canvas is a DOM element, valid on web */}
              <canvas
                ref={canvasRef}
                width={340}
                height={160}
                style={{
                  width: "100%",
                  height: "100%",
                  touchAction: "none",
                  cursor: "crosshair",
                }}
              />
            </View>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={handleClearCanvas} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Clear</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={handleConfirmDraw} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Use Signature</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.uploadArea}>
            <Text style={styles.hint}>Pick a signature image from your gallery</Text>
            {uploadedUri ? (
              <View style={styles.uploadPreview}>
                <Image source={{ uri: uploadedUri }} style={styles.uploadImage} resizeMode="contain" />
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
                <Pressable accessibilityRole="button" onPress={() => { setUploadedUri(null); setUploadedDataUrl(null); }} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>Change</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={handleConfirmUpload} style={styles.confirmBtn}>
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

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.background ?? "#ffffff" },
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
  title: { color: colors.text, fontSize: typography.title ?? 20, fontWeight: "900" },
  closeBtn: { padding: spacing.xs },
  closeBtnText: { color: colors.muted, fontSize: typography.body, fontWeight: "700" },
  tabBar: {
    backgroundColor: "#f1f5f9",
    flexDirection: "row",
    gap: 4,
    margin: spacing.lg,
    borderRadius: 8,
    padding: 4,
  },
  tab: { alignItems: "center", borderRadius: 6, flex: 1, justifyContent: "center", paddingVertical: 10 },
  tabActive: { backgroundColor: colors.primary },
  tabText: { color: colors.muted, fontSize: typography.caption, fontWeight: "900" },
  tabTextActive: { color: colors.onPrimary ?? "#ffffff" },
  hint: {
    color: colors.muted,
    fontSize: typography.caption,
    fontWeight: "700",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  drawArea: { gap: spacing.md },
  canvasWrapper: {
    backgroundColor: "#ffffff",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 160,
    marginHorizontal: spacing.lg,
    overflow: "hidden",
  },
  uploadArea: { flex: 1, gap: spacing.md, paddingTop: spacing.sm },
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
  uploadImage: { height: "100%", width: "100%" },
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
  pickBtnText: { color: colors.muted, fontSize: typography.caption, fontWeight: "900" },
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
  clearBtnText: { color: colors.muted, fontSize: typography.body, fontWeight: "900" },
  confirmBtn: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    flex: 2,
    justifyContent: "center",
    minHeight: 48,
  },
  confirmBtnText: { color: colors.onPrimary ?? "#ffffff", fontSize: typography.body, fontWeight: "900" },
});
