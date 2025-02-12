import { tool } from "ai";
import { z } from "zod";

export const getWeather = tool({
  description: "Get the current weather at a location",
  parameters: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  execute: async ({ latitude, longitude }) => {
    const startTime = new Date().toISOString();
    console.log("Weather tool execution started:", {
      latitude,
      longitude,
      startTime,
      requestId: Math.random().toString(36).substring(7),
    });
    
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto`
      );

      const weatherData = await response.json();
      
      const endTime = new Date().toISOString();
      console.log("Weather data fetched successfully:", {
        temperature: weatherData.current?.temperature_2m,
        latitude,
        longitude,
        startTime,
        endTime,
        duration: new Date(endTime).getTime() - new Date(startTime).getTime(),
        status: response.status,
      });

      return weatherData;
    } catch (error) {
      const errorTime = new Date().toISOString();
      console.error("Error fetching weather data:", {
        error,
        latitude,
        longitude,
        startTime,
        errorTime,
        duration: new Date(errorTime).getTime() - new Date(startTime).getTime(),
      });
      throw error;
    }
  },
});
