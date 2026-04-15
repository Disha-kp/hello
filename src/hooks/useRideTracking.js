import { useEffect, useRef, useState, useCallback } from 'react';
import { db } from '../firebase';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';

/**
 * useRideTracking
 *
 * For the DRIVER  → broadcasts their GPS location to Firestore every 5 s
 * For PASSENGERS  → subscribes to the same Firestore doc and reads live positions
 *
 * Returns:
 *   driverLocation   : { lat, lon } | null   — live driver GPS
 *   passengerPickups : [{ lat, lon, uid, name }]  — all booked passengers' pickup coords
 *   startBroadcast() — call once when the driver starts the ride
 *   stopBroadcast()  — call when ride ends
 */
export function useRideTracking(rideId, currentUser, isDriver) {
    const [driverLocation, setDriverLocation] = useState(null);
    const [passengerPickups, setPassengerPickups] = useState([]);
    const watchIdRef = useRef(null);
    const intervalRef = useRef(null);

    // ── Subscribe to Firestore for live updates (both driver and passengers) ─
    useEffect(() => {
        if (!rideId) return;

        const rideRef = doc(db, 'rides', rideId);
        const unsub = onSnapshot(rideRef, (snap) => {
            if (!snap.exists()) return;
            const data = snap.data();

            // Driver location
            if (data.driverLat && data.driverLon) {
                setDriverLocation({ lat: data.driverLat, lon: data.driverLon });
            }

            // Passenger pickup locations (stored as passengerLocations map: { uid: { lat, lon, name } })
            if (data.passengerLocations) {
                const list = Object.entries(data.passengerLocations).map(([uid, val]) => ({
                    uid,
                    lat: val.lat,
                    lon: val.lon,
                    name: val.name || 'Rider',
                }));
                setPassengerPickups(list);
            }
        });

        return () => unsub();
    }, [rideId]);

    // ── Driver: start broadcasting GPS every 5 seconds ─────────────────────
    const startBroadcast = useCallback(() => {
        if (!isDriver || !rideId || !navigator.geolocation) return;

        const pushLocation = () => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    try {
                        const rideRef = doc(db, 'rides', rideId);
                        await updateDoc(rideRef, {
                            driverLat: pos.coords.latitude,
                            driverLon: pos.coords.longitude,
                        });
                    } catch (e) { console.error('Driver location push error:', e); }
                },
                (err) => console.warn('Geolocation error:', err.message),
                { enableHighAccuracy: true, timeout: 8000 }
            );
        };

        pushLocation(); // Immediate first push
        intervalRef.current = setInterval(pushLocation, 5000);
    }, [isDriver, rideId]);

    const stopBroadcast = useCallback(() => {
        if (intervalRef.current) clearInterval(intervalRef.current);
        if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    }, []);

    // ── Passenger: save their pickup location once when they book ──────────
    const savePassengerLocation = useCallback(async (rideId, uid, name) => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                try {
                    const rideRef = doc(db, 'rides', rideId);
                    await updateDoc(rideRef, {
                        [`passengerLocations.${uid}`]: {
                            lat: pos.coords.latitude,
                            lon: pos.coords.longitude,
                            name: name || 'Rider',
                        },
                    });
                } catch (e) { console.error('Passenger location save error:', e); }
            },
            (err) => console.warn('Passenger geolocation error:', err.message),
            { enableHighAccuracy: true, timeout: 8000 }
        );
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => stopBroadcast();
    }, [stopBroadcast]);

    return { driverLocation, passengerPickups, startBroadcast, stopBroadcast, savePassengerLocation };
}
