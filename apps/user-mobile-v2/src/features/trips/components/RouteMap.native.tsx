import { Text, View } from "react-native";

import { colors, spacing, typography } from "@/theme/tokens";

export type LatLng = [number, number];

export type RouteGeometry = {
  coordinates: [number, number][];
  type: "LineString";
};

export type RouteMapRoute = {
  distanceM: number;
  durationS: number;
  geometry: RouteGeometry;
  id: string;
  summary: string;
};

type RouteMapProps = {
  destinationLatLng: LatLng | null;
  mode: "pinning" | "routing";
  onDestinationSet: (latLng: LatLng) => void;
  onOriginSet: (latLng: LatLng) => void;
  onRouteClick: (index: number) => void;
  originLatLng: LatLng | null;
  routes: RouteMapRoute[];
  selectedIndex: number | null;
};

export function RouteMap({
  destinationLatLng,
  originLatLng,
  routes
}: RouteMapProps) {
  return (
    <View
      style={{
        alignItems: "center",
        backgroundColor: "#eef2ff",
        borderColor: "#c7d2fe",
        borderRadius: 14,
        borderWidth: 1,
        gap: spacing.sm,
        minHeight: 260,
        justifyContent: "center",
        padding: spacing.lg
      }}
    >
      <Text
        style={{
          color: colors.text,
          fontSize: typography.body,
          fontWeight: "900",
          textAlign: "center"
        }}
      >
        Map route calculator
      </Text>
      <Text
        style={{
          color: colors.muted,
          fontSize: typography.caption,
          fontWeight: "700",
          lineHeight: 18,
          textAlign: "center"
        }}
      >
        Search origin and destination, then calculate route. Native map tapping
        will be wired with the mobile map package after the web parity pass.
      </Text>
      <Text
        style={{
          color: "#4f46e5",
          fontSize: typography.caption,
          fontWeight: "900",
          textAlign: "center"
        }}
      >
        Origin {originLatLng ? "set" : "not set"} · Destination{" "}
        {destinationLatLng ? "set" : "not set"} · Routes {routes.length}
      </Text>
    </View>
  );
}
