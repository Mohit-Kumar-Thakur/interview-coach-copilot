import Link from "next/link";

type ProfileCompletionBannerProps = {
    score: number;
};

export default function ProfileCompletionBanner({ score }: ProfileCompletionBannerProps) {
    // Only show if score < 60%
    if (score >= 60) return null;

    return (
        <div
            className="border rounded-xl p-4 mb-6"
            style={{
                background: 'rgb(var(--primary) / 0.05)',
                borderColor: 'rgb(var(--primary) / 0.3)',
            }}
        >
            <div className="flex items-start gap-3">
                {/* Info Icon */}
                <svg className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'rgb(var(--primary))' }} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>

                <div className="flex-1">
                    <p className="text-sm font-medium" style={{ color: 'rgb(var(--text))' }}>
                        Complete your profile to improve interview quality
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'rgb(var(--subtext))' }}>
                        Your profile is {score}% complete. A complete profile helps provide more personalized feedback.
                    </p>
                    <Link
                        href="/profile"
                        className="inline-block mt-2 text-xs font-medium underline hover:no-underline"
                        style={{ color: 'rgb(var(--primary))' }}
                    >
                        Complete Profile →
                    </Link>
                </div>
            </div>
        </div>
    );
}
