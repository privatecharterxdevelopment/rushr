// Placeholder Supabase browser client for website
export const supabaseBrowser = () => {
  return {
    auth: {
      signOut: async () => {
        console.log('Signing out...');
        return { error: null };
      },
    },
  };
};