# URL Shortener Service

## Overview

The URL Shortener Service provides a robust and user-friendly platform to shorten long URLs, analyze usage, and manage links effectively. This service leverages Google Sign-In for secure user authentication and offers a suite of APIs for creating, redirecting, and analyzing short URLs.

## Features

### 1. User Authentication

- **Description**: Secure user registration and login using Google Sign-In only.
- **Benefits**: Enhances user experience by eliminating the need for additional login credentials.

### 1. Create Short URL API

- **Endpoint**: `/api/shorten`
- **Method**: POST
- **Description**: Generate a short URL for a given long URL.
- **Request Body**:
  - `longUrl` (string): The original URL to be shortened.
  - `customAlias` (string, optional): Custom alias for the short URL (defaults to a generated unique alias).
  - `topic` (string, optional): Category for the short URL (e.g., acquisition, activation).
- **Response**:
  - `shortUrl` (string): The generated short URL.
  - `createdAt` (datetime): Timestamp of creation.
- **Additional Features**:
  - Rate limiting to restrict the number of URLs a user can create within a given timeframe.

### 1. Redirect Short URL API

- **Endpoint**: `/api/shorten/{alias}`
- **Method**: GET
- **Description**: Redirect users to the original URL using the short URL alias.
- **Response**: Redirects to the original long URL.
- **Analytics Tracking**: Logs details such as timestamp, user agent, IP address, and geolocation.

### 1. Get URL Analytics API

- **Endpoint**: `/api/analytics/{alias}`
- **Method**: GET
- **Description**: Retrieve detailed analytics for a specific short URL.
- **Response**:
  - `totalClicks` (number): Total clicks on the short URL.
  - `uniqueClicks` (number): Unique user interactions.
  - `clicksByDate` (array): Click counts for the last 7 days.
  - `osType` (array): Breakdown of clicks by operating system.
  - `deviceType` (array): Breakdown of clicks by device type.

### 1. Get Topic-Based Analytics API

- **Endpoint**: `/api/analytics/topic/{topic}`
- **Method**: GET
- **Description**: Retrieve analytics for all short URLs under a specific topic.
- **Response**:
  - `totalClicks` (number): Total clicks for the topic.
  - `uniqueClicks` (number): Unique users for the topic.
  - `clicksByDate` (array): Daily click counts for the topic.
  - `urls` (array): List of URLs with individual click metrics.

### 1. Get Overall Analytics API

- **Endpoint**: `/api/analytics/overall`
- **Method**: GET
- **Description**: Retrieve overall analytics for all URLs created by the authenticated user.
- **Response**:
  - `totalUrls` (number): Total short URLs created.
  - `totalClicks` (number): Total clicks across all URLs.
  - `uniqueClicks` (number): Unique user interactions.
  - `clicksByDate` (array): Daily click counts.
  - `osType` (array): Breakdown by operating system.
  - `deviceType` (array): Breakdown by device type.

### 1. Caching

- **Description**: Implement caching with Redis to improve performance by reducing database queries.
- **Applications**:
  - Store short and long URLs.
  - Cache analytics data for quick retrieval.
  - Enhance redirect response times.

## Technology Stack

- **Frontend**: Not applicable (API-only service).
- **Backend**: Node.js with Express.js.
- **Database**: MongoDB.
- **Caching**: Redis.
- **Authentication**: Google Sign-In.

## Deployment

- **Rate Limiting**: Use middleware like `express-rate-limit`.
- **Caching**: Configure Redis for high availability and low latency.
- **Analytics Tracking**: Integrate with third-party analytics APIs for geolocation and user agent parsing.
