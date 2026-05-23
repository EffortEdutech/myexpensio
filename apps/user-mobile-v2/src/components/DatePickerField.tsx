import { useMemo, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme/tokens";

type DatePickerFieldProps = {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
};

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DatePickerField({
  disabled,
  label,
  onChange,
  value
}: DatePickerFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => dateFromInput(value));
  const days = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth]);

  function chooseDate(date: Date) {
    onChange(toDateInput(date));
    setIsOpen(false);
  }

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          setVisibleMonth(dateFromInput(value));
          setIsOpen(true);
        }}
        style={[styles.inputButton, disabled ? styles.disabled : null]}
      >
        <Text style={styles.inputText}>{formatDisplayDate(value)}</Text>
        <Text style={styles.calendarIcon}>▾</Text>
      </Pressable>

      <Modal
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
        transparent
        visible={isOpen}
      >
        <View style={styles.overlay}>
          <View style={styles.calendarSheet}>
            <View style={styles.calendarHeader}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setVisibleMonth(addMonths(visibleMonth, -1))}
                style={styles.monthButton}
              >
                <Text style={styles.monthButtonText}>‹</Text>
              </Pressable>
              <Text style={styles.monthTitle}>{formatMonth(visibleMonth)}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setVisibleMonth(addMonths(visibleMonth, 1))}
                style={styles.monthButton}
              >
                <Text style={styles.monthButtonText}>›</Text>
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {weekdays.map((day) => (
                <Text key={day} style={styles.weekday}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.grid}>
              {days.map((day) => {
                const dateValue = toDateInput(day.date);
                const isSelected = dateValue === value;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={dateValue}
                    onPress={() => chooseDate(day.date)}
                    style={[
                      styles.dayCell,
                      !day.inMonth ? styles.dayCellMuted : null,
                      isSelected ? styles.dayCellSelected : null
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayText,
                        !day.inMonth ? styles.dayTextMuted : null,
                        isSelected ? styles.dayTextSelected : null
                      ]}
                    >
                      {day.date.getDate()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Pressable
                accessibilityRole="button"
                onPress={() => chooseDate(new Date())}
                style={styles.todayButton}
              >
                <Text style={styles.todayButtonText}>Today</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setIsOpen(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function buildCalendarDays(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const firstWeekday = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - firstWeekday);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);

    return {
      date,
      inMonth: date.getMonth() === monthDate.getMonth()
    };
  });
}

function dateFromInput(value: string) {
  if (!value) {
    return new Date();
  }

  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    return new Date();
  }

  return new Date(year, month - 1, day);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function toDateInput(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("en-MY", {
    month: "long",
    year: "numeric"
  });
}

function formatDisplayDate(value: string) {
  return dateFromInput(value)
    .toLocaleDateString("en-MY", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    })
    .replaceAll(" ", "-");
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    gap: 6
  },
  label: {
    color: "#374151",
    fontSize: typography.caption,
    fontWeight: "800"
  },
  inputButton: {
    alignItems: "center",
    backgroundColor: colors.surface,
    borderColor: "#d1d5db",
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    minHeight: 44,
    paddingHorizontal: spacing.md
  },
  inputText: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "700"
  },
  calendarIcon: {
    color: "#64748b",
    fontSize: 16,
    fontWeight: "800"
  },
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.42)",
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg
  },
  calendarSheet: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.md,
    maxWidth: 380,
    padding: spacing.lg,
    width: "100%"
  },
  calendarHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  monthButton: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },
  monthButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
    lineHeight: 22
  },
  monthTitle: {
    color: colors.text,
    fontSize: typography.body,
    fontWeight: "900"
  },
  weekRow: {
    flexDirection: "row"
  },
  weekday: {
    color: "#64748b",
    flex: 1,
    fontSize: 11,
    fontWeight: "900",
    textAlign: "center"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  dayCell: {
    alignItems: "center",
    aspectRatio: 1,
    flexBasis: "14.2857%",
    justifyContent: "center"
  },
  dayCellMuted: {
    opacity: 0.38
  },
  dayCellSelected: {
    backgroundColor: colors.primary,
    borderRadius: 8
  },
  dayText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  dayTextMuted: {
    color: "#94a3b8"
  },
  dayTextSelected: {
    color: colors.onPrimary
  },
  footer: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end"
  },
  todayButton: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  todayButtonText: {
    color: colors.text,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: colors.primary,
    borderRadius: 8,
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: spacing.md
  },
  closeButtonText: {
    color: colors.onPrimary,
    fontSize: typography.caption,
    fontWeight: "800"
  },
  disabled: {
    opacity: 0.5
  }
});
