export type MockUser = {
  id: string;
  name: string;
  email: string;
};

export type MockSession = {
  user: MockUser;
};

export const mockSession: MockSession = {
  user: {
    id: "test-user-id",
    name: "Test User",
    email: "test@example.com",
  },
};
