// Test double for the Base44 virtual module '@/entities/all'.
// Each entity exposes the SDK surface as no-op async fns; tests override per-case.
const makeEntity = () => ({
  list: async () => [],
  filter: async () => [],
  create: async (data) => ({ id: 'test-id', ...data }),
  update: async (id, data) => ({ id, ...data }),
  delete: async () => true,
});

const registry = {};
export default new Proxy(registry, {
  get: (target, name) => {
    if (!(name in target)) target[name] = makeEntity();
    return target[name];
  },
});

export const DailyCheckIn = makeEntity();
export const Person = makeEntity();
export const Reading = makeEntity();
export const BoundaryAlert = makeEntity();
export const HealingProgress = makeEntity();
export const CosmicWisdom = makeEntity();
export const User = makeEntity();
