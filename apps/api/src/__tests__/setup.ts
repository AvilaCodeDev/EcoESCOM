process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/testdb";
process.env.JWT_SECRET = "test-secret-key-at-least-32-chars-long";
process.env.JWT_EXPIRES_IN = "1h";
process.env.NODE_ENV = "test";
process.env.PORT = "4000";
