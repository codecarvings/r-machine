import { GearPlug, type R } from "../setup";

interface User {
  name: string;
}

interface GearState {
  loading: boolean;
  error: string | null;
  user: User | null;
}

export const plug = GearPlug().reactive<GearState>({
  loading: true,
  error: null,
  user: null,
});

export const r = plug.Gear(() => {
  const { $, _ } = plug.use();

  const setLoading = _.action(() => ({ loading: true, error: null, user: null }));
  const setUser = _.action((user: User) => ({ loading: false, error: null, user }));
  const setError = _.action((error: string) => ({ loading: false, error, user: null }));

  return {
    loading: _.getter(() => $.state.loading),
    error: _.getter(() => $.state.error),
    user: _.getter(() => $.state.user),

    loadUser: async (userId: string) => {
      setLoading();

      try {
        const userData: User = await new Promise((resolve) =>
          setTimeout(() => resolve({ name: `User ${userId}` }), 1000)
        );
        setUser(userData);
      } catch {
        setError("Failed to load user data.");
      }
    },
  };
});

export type Gear_Aggregator = R<typeof r>;
