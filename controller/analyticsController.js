const Url = require("../models/ShortUrl")
const Analytics = require("../models/analytics")
const redisClient = require("../util/redisClient");
exports.clickEventsHandler = async (req, res) => {
    try {
        const alias = req.params.alias;
        const userId = req.user.id;

        const cacheKey = `analytics:${userId}:${alias}`;

        // Check Redis cache for existing data
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Serving data from cache.");
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Fetch URL to ensure it belongs to the user
        const shortUrl = await Url.findOne({ userId, customAlias: alias });
        if (!shortUrl) {
            return res.status(404).json({ message: "Short URL not found for this user" });
        }

        // Fetch analytics for the specific alias
        const analytics = await Analytics.aggregate([
            { $match: { alias: alias } },
            {
                $group: {
                    _id: "$ipAddress",
                    clicks: { $sum: 1 },
                    osName: { $first: "$osName" },
                    deviceName: { $first: "$deviceName" },
                    date: { $first: "$date" },
                },
            },
            { $sort: { date: 1 } },
        ]);

        const totalClicks = analytics.length;
        const uniqueClicks = analytics.length;

        // Group by date for clicks in the last 7 days
        const recentDate = new Date();
        recentDate.setDate(recentDate.getDate() - 7);
        const clicksByDate = await Analytics.aggregate([
            { $match: { alias, timestamp: { $gte: recentDate } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    clicks: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Group analytics by OS and Device type
        const osType = await Analytics.aggregate([
            { $match: { alias: alias } },
            {
                $group: {
                    _id: "$osName",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ipAddress" },
                },
            },
            {
                $project: {
                    osName: "$_id",
                    uniqueClicks: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                },
            },
        ]);

        const deviceType = await Analytics.aggregate([
            { $match: { alias: alias } },
            {
                $group: {
                    _id: "$deviceName",
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: "$ipAddress" },
                },
            },
            {
                $project: {
                    deviceName: "$_id",
                    uniqueClicks: 1,
                    uniqueUsers: { $size: "$uniqueUsers" },
                },
            },
        ]);

        // Prepare response data
        const responseData = {
            totalClicks,
            uniqueClicks,
            clicksByDate,
            osType,
            deviceType,
        };

        // Cache the data in Redis for 1 hour
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 });

        console.log("Data cached in Redis.");
        // Send response
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error retrieving analytics:", error);
        res.status(500).send("Internal server error");
    }
};



exports.topicHandler = async (req, res) => {
    try {
        const topic = req.params.topic;
        const userId = req.user.id;
        const cacheKey = `topicAnalytics:${userId}:${topic}`;

        // Check Redis cache for existing data
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Serving data from cache.");
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Fetch URLs under the specified topic
        const urls = await Url.find({ userId, topic });

        if (urls.length === 0) {
            return res.status(404).json({ message: "No URLs found for this topic" });
        }

        // Extract aliases of URLs under the topic
        const aliases = urls.map((url) => url.customAlias);

        // Total clicks and unique users across all URLs in the topic
        const totalClicks = await Analytics.countDocuments({ alias: { $in: aliases } });
        const uniqueClicks = await Analytics.distinct("ipAddress", { alias: { $in: aliases } }).then(
            (ips) => ips.length
        );

        // Clicks by date for the topic
        const clicksByDate = await Analytics.aggregate([
            { $match: { alias: { $in: aliases } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                    clicks: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // Gather analytics for each short URL in the topic
        const urlsAnalytics = await Promise.all(
            urls.map(async (url) => {
                const alias = url.customAlias;
                const shortUrl = url.shortUrl;

                // Total and unique clicks for the URL
                const totalClicksForUrl = await Analytics.countDocuments({ alias });
                const uniqueClicksForUrl = await Analytics.distinct("ipAddress", { alias }).then(
                    (ips) => ips.length
                );

                return {
                    shortUrl,
                    totalClicks: totalClicksForUrl,
                    uniqueClicks: uniqueClicksForUrl,
                };
            })
        );

        // Prepare response data
        const responseData = {
            totalClicks,
            uniqueClicks,
            clicksByDate,
            urls: urlsAnalytics,
        };

        // Cache the data in Redis for 1 hour
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 });

        console.log("Data cached in Redis.");
        // Send response
        res.status(200).json(responseData);
    } catch (error) {
        console.error("Error fetching topic-based analytics:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};



exports.overAllClickHandler = async (req, res) => {
    try {
        const userId = req.user.id; 
        const cacheKey = `overallAnalytics:${userId}`;

        // Check Redis cache for existing data
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
            console.log("Serving data from cache.");
            return res.status(200).json(JSON.parse(cachedData));
        }

        // Fetch all URLs created by the user
        const urls = await Url.find({ userId });

        if (urls.length === 0) {
            return res.status(404).json({ message: 'No URLs found for this user' });
        }

        // Extract aliases of the user's URLs
        const aliases = urls.map(url => url.customAlias);

        // Total URLs created
        const totalUrls = urls.length;

        // Total clicks and unique clicks across all URLs
        const totalClicks = await Analytics.countDocuments({ alias: { $in: aliases } });
        const uniqueClicks = await Analytics.distinct('ipAddress', { alias: { $in: aliases } }).then(
            ips => ips.length
        );

        // Clicks by date for all URLs
        const clicksByDate = await Analytics.aggregate([
            { $match: { alias: { $in: aliases } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                    clicks: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        // OS analytics
        const osType = await Analytics.aggregate([
            { $match: { alias: { $in: aliases } } },
            {
                $group: {
                    _id: '$osName',
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$ipAddress' },
                },
            },
            {
                $project: {
                    osName: '$_id',
                    uniqueClicks: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                },
            },
        ]);

        // Device type analytics
        const deviceType = await Analytics.aggregate([
            { $match: { alias: { $in: aliases } } },
            {
                $group: {
                    _id: '$deviceType',
                    uniqueClicks: { $sum: 1 },
                    uniqueUsers: { $addToSet: '$ipAddress' },
                },
            },
            {
                $project: {
                    deviceName: '$_id',
                    uniqueClicks: 1,
                    uniqueUsers: { $size: '$uniqueUsers' },
                },
            },
        ]);

        // Prepare response data
        const responseData = {
            totalUrls,
            totalClicks,
            uniqueClicks,
            clicksByDate,
            osType,
            deviceType,
        };

        // Cache the data in Redis for 1 hour
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 3600 });

        console.log("Data cached in Redis.");
        // Send response
        res.status(200).json(responseData);
    } catch (error) {
        console.error('Error fetching overall analytics:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
