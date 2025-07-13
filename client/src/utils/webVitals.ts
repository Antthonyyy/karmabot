import { onCLS, onFCP, onLCP, onTTFB, type Metric } from "web-vitals";

// Function to send metrics to analytics
const sendToAnalytics = (metric: Metric) => {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("📊 Web Vital:", metric);
  }

  // Send to your analytics service in production
  if (process.env.NODE_ENV === "production") {
    // You can send to Google Analytics, Sentry, or any other service
    // Example: ga('send', 'event', 'Web Vitals', metric.name, metric.value);
    
    // For now, just log to console
    console.log("📊 Web Vital:", {
      name: metric.name,
      value: metric.value,
      id: metric.id,
      rating: metric.rating,
    });
  }
};

// Initialize web vitals tracking
export const initWebVitals = () => {
  try {
    onCLS(sendToAnalytics);
    onFCP(sendToAnalytics);
    onLCP(sendToAnalytics);
    onTTFB(sendToAnalytics);
    
    console.log("📊 Web Vitals tracking initialized");
  } catch (error) {
    console.error("Failed to initialize web vitals:", error);
  }
};

export default initWebVitals; 