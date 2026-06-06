/**
 * SkeletonRow — animated placeholder for list items while data loads.
 *
 * Usage:
 *   {isLoading && claims.length === 0 ? (
 *     <SkeletonList count={6} />
 *   ) : ...}
 */
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme/tokens";

function SkeletonRow() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View style={[styles.row, { opacity }]}>
      <View style={styles.leftBlock} />
      <View style={styles.midCol}>
        <View style={styles.titleBar} />
        <View style={styles.subtitleBar} />
      </View>
      <View style={styles.rightBlock} />
    </Animated.View>
  );
}

type SkeletonListProps = {
  count?: number;
};

export function SkeletonList({ count = 5 }: SkeletonListProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.border,
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    minHeight: 72,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  leftBlock: {
    backgroundColor: "#e2e8f0",
    borderRadius: 6,
    height: 40,
    width: 80,
  },
  midCol: {
    flex: 1,
    gap: 8,
  },
  titleBar: {
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    height: 14,
    width: "70%",
  },
  subtitleBar: {
    backgroundColor: "#f1f5f9",
    borderRadius: 4,
    height: 11,
    width: "45%",
  },
  rightBlock: {
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    height: 16,
    width: 56,
  },
});
