// const geoip = require('geoip-lite');
const Analytics = require("../models/analytics")
const Url = require("../models/ShortUrl")
const mongoose = require("mongoose");
const redisClient = require("../util/redisClient");
exports.postShortUrl = async (req, res) => {


    const { longUrl, customAlias, topic } = req.body;
    const {id} = req.user
    

    if (!longUrl) {
        return res.status(400).json({ error: "longUrl is required." });
    }
   
    try {
        let shortUrl;
        const { nanoid } = await import("nanoid");
        // Check if customAlias is provided
        if (customAlias) {
            const existingAlias = await Url.findOne({ customAlias });
            if (existingAlias) {
                return res.status(400).json({ error: "Custom alias already exists." });
            }
            shortUrl = `${process.env.BASE_URL}/api/shorten/${customAlias}`;
           
        } else {
            // Generate a unique short URL using nanoid
            const alias = nanoid(8); // Generate an 8-character unique ID
            shortUrl = `${process.env.BASE_URL}/api/shorten/${alias}`;
        }
        const url = new Url({
            longUrl,
            shortUrl,
            customAlias: customAlias || null,
            topic: topic || null,
            userId: id,
        });
       
        await url.save();
        res.status(201).json({
            shortUrl: url.shortUrl,
            createdAt: url.createdAt,
        });
    } catch (err) {
        res.status(500).json({ error: 'Error creating short URL', details: err.message});
    }
}

exports.redirectUrl = async (req,res) =>{
    try {
      
        const alias = req.params.alias;
        
        const cachedUrl = await redisClient.get(alias);
        if (cachedUrl) {
            return res.redirect(cachedUrl);
        }
        // Find the record in the database
        const urlRecord = await Url.findOne({ customAlias: alias });
    
        // If no record is found, return a 404 error
        if (!urlRecord) {
          return res.status(404).send('Short URL not found');
        }
        const userAgent = req.headers['user-agent'];
        const deviceName = /mobile/i.test(userAgent) ? 'mobile' : 'desktop';
        const osName = /Windows/i.test(userAgent)
          ? 'Windows'
          : /Mac/i.test(userAgent)
          ? 'macOS'
          : /Linux/i.test(userAgent)
          ? 'Linux'
          : /Android/i.test(userAgent)
          ? 'Android'
          : /iOS/i.test(userAgent)
          ? 'iOS'
          : 'Other';
    
        // Log click event
        await Analytics.create({
          alias,
          ipAddress: req.ip,
          userAgent,
          osName,
          deviceName,
        });
        await redisClient.set(alias, urlRecord.longUrl, { EX: 3600 }); 
        // Redirect to the original URL
        res.redirect(urlRecord.longUrl);
      } catch (error) {
        console.error('Error during redirection:', error);
        res.status(500).send('Internal server error');
      }
}