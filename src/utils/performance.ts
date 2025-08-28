import React from 'react';
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Performance monitoring utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Record<string, number> = {};

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Initialize Web Vitals monitoring
  initWebVitals() {
    getCLS(this.onPerfEntry);
    getFID(this.onPerfEntry);
    getFCP(this.onPerfEntry);
    getLCP(this.onPerfEntry);
    getTTFB(this.onPerfEntry);
  }

  private onPerfEntry = (metric: any) => {
    this.metrics[metric.name] = metric.value;
    console.log(`[Performance] ${metric.name}:`, metric.value);
  };

  // Measure component render time
  measureRender<T extends (...args: any[]) => any>(
    componentName: string,
    renderFunction: T
  ): T {
    return ((...args: Parameters<T>) => {
      const start = performance.now();
      const result = renderFunction(...args);
      const end = performance.now();
      
      console.log(`[Render Time] ${componentName}: ${(end - start).toFixed(2)}ms`);
      return result;
    }) as T;
  }

  // Measure async operation time
  async measureAsync<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await operation();
      const end = performance.now();
      console.log(`[Async Operation] ${operationName}: ${(end - start).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const end = performance.now();
      console.log(`[Async Operation Failed] ${operationName}: ${(end - start).toFixed(2)}ms`);
      throw error;
    }
  }

  // Get current metrics
  getMetrics() {
    return { ...this.metrics };
  }

  // Clear metrics
  clearMetrics() {
    this.metrics = {};
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    measureRender: monitor.measureRender.bind(monitor),
    measureAsync: monitor.measureAsync.bind(monitor),
    getMetrics: monitor.getMetrics.bind(monitor),
    clearMetrics: monitor.clearMetrics.bind(monitor),
  };
};

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName: string
) {
  const WithPerformanceMonitoring = (props: P) => {
    const start = performance.now();
    const result = React.createElement(WrappedComponent, props);
    const end = performance.now();
    
    console.log(`[Render Time] ${componentName}: ${(end - start).toFixed(2)}ms`);
    return result;
  };

  WithPerformanceMonitoring.displayName = `withPerformanceMonitoring(${componentName})`;
  return WithPerformanceMonitoring;
}

// Debounce utility for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// Throttle utility for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}