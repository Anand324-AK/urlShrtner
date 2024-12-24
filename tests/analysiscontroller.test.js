const request = require('supertest');
const app = require('../app'); // Your Express app instance
const redisClient = require('../redisClient'); // Your Redis client instance
const Url = require('../models/Url');

jest.mock('../redisClient');
jest.mock('../models/Url');
jest.mock('../models/Analytics');

describe('Analytics Handlers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('clickEventsHandler', () => {
    it('should return analytics data from Redis cache if available', async () => {
      const alias = 'testAlias';
      const userId = 'testUser';
      const cachedData = { totalClicks: 10, uniqueClicks: 5 };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const response = await request(app)
        .get(`/analytics/${alias}`)
        .set('Authorization', `Bearer mockToken`);

      expect(redisClient.get).toHaveBeenCalledWith(`analytics:${userId}:${alias}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedData);
    });

    it('should fetch data from the database and cache it if not in Redis', async () => {
      const alias = 'testAlias';
      const userId = 'testUser';
      const urlMock = { userId, customAlias: alias };
      const analyticsMock = [{ _id: 'ip1', clicks: 1, osName: 'Windows', deviceName: 'PC', date: new Date() }];

      redisClient.get.mockResolvedValue(null);
      Url.findOne.mockResolvedValue(urlMock);
      Analytics.aggregate.mockResolvedValueOnce(analyticsMock).mockResolvedValueOnce([]).mockResolvedValueOnce([]);
      redisClient.set.mockResolvedValue();

      const response = await request(app)
        .get(`/analytics/${alias}`)
        .set('Authorization', `Bearer mockToken`);

      expect(redisClient.get).toHaveBeenCalledWith(`analytics:${userId}:${alias}`);
      expect(Url.findOne).toHaveBeenCalledWith({ userId, customAlias: alias });
      expect(Analytics.aggregate).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('topicHandler', () => {
    it('should return topic analytics data from Redis cache if available', async () => {
      const topic = 'testTopic';
      const userId = 'testUser';
      const cachedData = { totalClicks: 20, uniqueClicks: 10 };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const response = await request(app)
        .get(`/analytics/topic/${topic}`)
        .set('Authorization', `Bearer mockToken`);

      expect(redisClient.get).toHaveBeenCalledWith(`topicAnalytics:${userId}:${topic}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedData);
    });

    it('should fetch and cache topic data if not in Redis', async () => {
      const topic = 'testTopic';
      const userId = 'testUser';
      const urlsMock = [{ customAlias: 'alias1' }, { customAlias: 'alias2' }];

      redisClient.get.mockResolvedValue(null);
      Url.find.mockResolvedValue(urlsMock);
      Analytics.countDocuments.mockResolvedValue(10);
      Analytics.distinct.mockResolvedValue(['ip1', 'ip2']);
      Analytics.aggregate.mockResolvedValue([]);
      redisClient.set.mockResolvedValue();

      const response = await request(app)
        .get(`/analytics/topic/${topic}`)
        .set('Authorization', `Bearer mockToken`);

      expect(redisClient.get).toHaveBeenCalledWith(`topicAnalytics:${userId}:${topic}`);
      expect(Url.find).toHaveBeenCalledWith({ userId, topic });
      expect(Analytics.countDocuments).toHaveBeenCalled();
      expect(Analytics.distinct).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('overAllClickHandler', () => {
    it('should return overall analytics data from Redis cache if available', async () => {
      const userId = 'testUser';
      const cachedData = { totalUrls: 5, totalClicks: 30 };

      redisClient.get.mockResolvedValue(JSON.stringify(cachedData));

      const response = await request(app)
        .get(`/analytics/overall`)
        .set('Authorization', `Bearer mockToken`);

      expect(redisClient.get).toHaveBeenCalledWith(`overallAnalytics:${userId}`);
      expect(response.status).toBe(200);
      expect(response.body).toEqual(cachedData);
    });

    it('should fetch and cache overall data if not in Redis', async () => {
      const userId = 'testUser';
      const urlsMock = [{ customAlias: 'alias1' }, { customAlias: 'alias2' }];

      redisClient.get.mockResolvedValue(null);
      Url.find.mockResolvedValue(urlsMock);
      Analytics.countDocuments.mockResolvedValue(30);
      Analytics.distinct.mockResolvedValue(['ip1', 'ip2']);
      Analytics.aggregate.mockResolvedValue([]);
      redisClient.set.mockResolvedValue();

      const response = await request(app)
        .get(`/analytics/overall`)
        .set('Authorization', `Bearer mockToken`);

      expect(redisClient.get).toHaveBeenCalledWith(`overallAnalytics:${userId}`);
      expect(Url.find).toHaveBeenCalledWith({ userId });
      expect(Analytics.countDocuments).toHaveBeenCalled();
      expect(Analytics.distinct).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });
});
