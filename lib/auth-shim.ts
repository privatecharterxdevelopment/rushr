export type Session = null;
export function useSession(): { data: null; status: "unauthenticated" } {
  return { data: null, status: "unauthenticated" };
}
export async function signIn(..._args: any[]) { /* no-op */ }
export async function signOut(..._args: any[]) { /* no-op */ }
