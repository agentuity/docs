---
title: "Step 1: Handling User's Reuqest"
description: "The first thing to do is how to handle a user's request"
---


# Step 1: Basic Agent Lifecycle

## Overview
This step introduces the basic structure of an Agentuity agent and demonstrates how to handle incoming requests and provide responses.

## What You'll Learn
- How to create a basic agent handler function
- Understanding the three main parameters: `request`, `response`, and `context`
- Using the logger for debugging and information
- Creating JSON responses
- Processing request data and triggers

## Key API Features Used
- **Agent Lifecycle**: Basic handler function structure
- **Logging**: `context.logger.info()` for logging information
- **Response Types**: `response.json()` for JSON responses
- **Request Handling**: `request.trigger` and `request.data.text()` for accessing request data

Try sending a request to your agent!