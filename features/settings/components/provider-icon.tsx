/**
 * Real brand logos as inline SVG for email providers.
 * No external dependency needed.
 */

interface ProviderIconProps {
  provider: string;
  emailAddress?: string;
  size?: number;
}

/** Detect provider from email domain if provider field is generic "imap" */
function detectProvider(provider: string, email?: string): string {
  if (provider === "gmail") return "gmail";
  if (provider === "office365") return "outlook";
  if (email) {
    const domain = email.split("@")[1]?.toLowerCase() ?? "";
    if (domain === "gmail.com" || domain === "googlemail.com") return "gmail";
    if (domain === "outlook.com" || domain === "hotmail.com" || domain === "live.com" || domain === "msn.com") return "outlook";
    if (domain === "yahoo.com" || domain === "yahoo.co.id" || domain.startsWith("yahoo.")) return "yahoo";
    if (domain === "icloud.com" || domain === "me.com" || domain === "mac.com") return "icloud";
    if (domain === "proton.me" || domain === "protonmail.com") return "proton";
  }
  return "generic";
}

export function ProviderIcon({ provider, emailAddress, size = 32 }: ProviderIconProps) {
  const resolved = detectProvider(provider, emailAddress);

  const containerStyle: React.CSSProperties = {
    width: size,
    height: size,
    flexShrink: 0,
    borderRadius: "50%",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  if (resolved === "gmail") {
    return (
      <div style={containerStyle}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Gmail">
          <rect width="32" height="32" rx="16" fill="#fff"/>
          {/* Gmail M envelope */}
          <path d="M5 10.5v11A1.5 1.5 0 0 0 6.5 23h19A1.5 1.5 0 0 0 27 21.5v-11L16 18 5 10.5Z" fill="#EA4335"/>
          <path d="M5 10.5 16 18l11-7.5V9A1.5 1.5 0 0 0 25.5 7.5h-19A1.5 1.5 0 0 0 5 9v1.5Z" fill="#FBBC05"/>
          <path d="M5 10.5V9A1.5 1.5 0 0 1 6.5 7.5H16v10.5L5 10.5Z" fill="#34A853"/>
          <path d="M27 10.5V9A1.5 1.5 0 0 0 25.5 7.5H16v10.5l11-7.5Z" fill="#4285F4"/>
        </svg>
      </div>
    );
  }

  if (resolved === "outlook") {
    return (
      <div style={containerStyle}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Outlook">
          <rect width="32" height="32" rx="16" fill="#0078D4"/>
          <rect x="5" y="8" width="13" height="16" rx="1.5" fill="#fff" fillOpacity="0.15"/>
          <rect x="5" y="8" width="13" height="16" rx="1.5" fill="url(#outlook-grad)"/>
          <path d="M18 12h9v8.5a1.5 1.5 0 0 1-1.5 1.5H18V12Z" fill="#fff" fillOpacity="0.9"/>
          <path d="M18 12l4.5 4 4.5-4" stroke="#0078D4" strokeWidth="1" fill="none"/>
          <ellipse cx="11.5" cy="16" rx="3.5" ry="4" fill="#fff"/>
          <ellipse cx="11.5" cy="16" rx="2" ry="2.5" fill="#0078D4"/>
          <defs>
            <linearGradient id="outlook-grad" x1="5" y1="8" x2="18" y2="24" gradientUnits="userSpaceOnUse">
              <stop stopColor="#1A86D8"/>
              <stop offset="1" stopColor="#0058A3"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
    );
  }

  if (resolved === "yahoo") {
    return (
      <div style={containerStyle}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Yahoo Mail">
          <rect width="32" height="32" rx="16" fill="#6001D2"/>
          <text x="16" y="22" textAnchor="middle" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="16" fill="#fff">Y!</text>
        </svg>
      </div>
    );
  }

  if (resolved === "icloud") {
    return (
      <div style={containerStyle}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="iCloud Mail">
          <rect width="32" height="32" rx="16" fill="#3478F6"/>
          {/* Cloud shape */}
          <path d="M22 19.5a3 3 0 0 0-.5-5.95A5 5 0 0 0 12 15a3 3 0 0 0 .5 5.95" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
          <path d="M12.5 20.95h9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
    );
  }

  if (resolved === "proton") {
    return (
      <div style={containerStyle}>
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Proton Mail">
          <rect width="32" height="32" rx="16" fill="#6D4AFF"/>
          {/* Proton shield-like P */}
          <path d="M10 8h7a5 5 0 0 1 0 10h-4v6h-3V8Z" fill="#fff"/>
          <path d="M13 11h4a2 2 0 0 1 0 4h-4v-4Z" fill="#6D4AFF"/>
        </svg>
      </div>
    );
  }

  // Generic IMAP / unknown
  return (
    <div style={{ ...containerStyle, background: "#f1f5f9" }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Email">
        <rect x="2" y="4" width="20" height="16" rx="2" stroke="#94a3b8" strokeWidth="1.5"/>
        <path d="M2 7l10 7 10-7" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </div>
  );
}
