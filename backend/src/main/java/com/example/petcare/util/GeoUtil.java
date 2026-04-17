package com.example.petcare.util;

public class GeoUtil {

    private static final double EARTH_RADIUS_KM = 6371.0;

    public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double radLat1 = Math.toRadians(lat1);
        double radLat2 = Math.toRadians(lat2);
        double deltaLat = Math.toRadians(lat2 - lat1);
        double deltaLng = Math.toRadians(lng2 - lng1);

        double a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2)
            + Math.cos(radLat1) * Math.cos(radLat2)
            * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    public static String formatDistance(double km) {
        if (km < 1) {
            int meters = (int) Math.round(km * 1000);
            return meters + "m";
        }
        return String.format("%.1fkm", km);
    }
}