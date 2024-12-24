const request = require('supertest');
const app = require('../app');
const passport = require('passport');
const User = require('../models/users');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

// Mock environment variables
process.env.GOOGLE_APP_ID = 'test-google-app-id';
process.env.GOOGLE_APP_SECRET = 'test-google-app-secret';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  // Mock Passport Strategy
  passport.use(
    new (require('passport-mock-strategy'))(
      {
        name: 'google',
        user: { id: '123456789', displayName: 'Test User', emails: [{ value: 'test@example.com' }] },
      },
      (user, done) => done(null, user)
    )
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Google Authentication Routes', () => {
  it('should redirect to Google for authentication', async () => {
    const response = await request(app).get('/google');
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('https://accounts.google.com');
  });

  it('should handle Google callback and login user', async () => {
    User.findOne = jest.fn().mockResolvedValue(null); // Simulate no existing user
    User.create = jest.fn().mockResolvedValue({
      googleId: '123456789',
      name: 'Test User',
      email: 'test@example.com',
    });

    const response = await request(app).get('/google/auth');
    expect(response.status).toBe(200);
    expect(User.create).toHaveBeenCalledWith({
      googleId: '123456789',
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('should handle existing user during Google login', async () => {
    const mockUser = { googleId: '123456789', name: 'Test User', email: 'test@example.com' };
    User.findOne = jest.fn().mockResolvedValue(mockUser);

    const response = await request(app).get('/google/auth');
    expect(response.status).toBe(200);
    expect(response.body.user.googleId).toBe('123456789');
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('should handle authentication failure', async () => {
    passport.authenticate = jest.fn(() => (req, res) => res.redirect('/auth/failed'));

    const response = await request(app).get('/google/auth?error=mock_error');
    expect(response.status).toBe(302);
    expect(response.headers.location).toBe('/auth/failed');
  });
});
