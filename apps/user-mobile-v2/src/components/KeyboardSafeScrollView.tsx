/**
 * KeyboardSafeScrollView
 *
 * A drop-in replacement for ScrollView inside Modal forms.
 * Wraps content in KeyboardAvoidingView so the keyboard doesn't
 * obscure the focused input on iOS or Android.
 *
 * Usage:
 *   Replace <ScrollView contentContainerStyle={styles.modalBody}>
 *   with    <KeyboardSafeScrollView contentContainerStyle={styles.modalBody}>
 */
import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
};

export function KeyboardSafeScrollView({ children, contentContainerStyle, style }: Props) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.flex}
    >
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        keyboardShouldPersistTaps="handled"
        style={[styles.flex, style]}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
