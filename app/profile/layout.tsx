export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  // No guard here - let the page itself handle auth
  // This prevents double-loading issues
  return <>{children}</>
}