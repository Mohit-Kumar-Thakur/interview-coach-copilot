import { useEffect, useState } from "react";
import { safeFetch } from "@/lib/api";

const CACHE_KEY = "icc_profile_score";

type ProfileData = {
    id: number;
    email: string;
    full_name: string | null;
    college: string | null;
    department: string | null;
    graduation_year: number | null;
    profile_score?: number;
    created_at?: string;
};

export function useProfileScore(backendBase: string) {
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [loading, setLoading] = useState(false);

    // Load cached score from localStorage on mount
    useEffect(() => {
        if (typeof window === "undefined") return;

        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setProfileData(parsed);
            } catch {
                // Invalid cache, ignore
            }
        }

        // Revalidate in background
        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const res = await safeFetch(`${backendBase}/api/users/me`);
            const data = await res.json();

            setProfileData(data);

            // Cache in localStorage
            if (typeof window !== "undefined") {
                localStorage.setItem(CACHE_KEY, JSON.stringify(data));
            }
        } catch (err) {
            // Silently fail, keep cached data if available
            console.error("Failed to fetch profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const refreshScore = () => {
        fetchProfile();
    };

    return {
        profileData,
        loading,
        refreshScore,
    };
}
