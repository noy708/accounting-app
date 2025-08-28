import React from 'react';
import { render, screen } from '@testing-library/react';
import { PerformanceMonitor, withPerformanceMonitoring } from '../../utils/performance';

// Simple test component
const TestComponent: React.FC<{ name: string }> = ({ name }) => (
  <div>Hello {name}</div>
);

describe('Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.clearMetrics();
    
    // Mock performance.now for consistent testing
    jest.spyOn(performance, 'now')
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(100);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Performance Monitoring Utilities', () => {
    it('should measure render time correctly', () => {
      const mockRenderFunction = jest.fn(() => 'Test Result');
      const measuredFunction = performanceMonitor.measureRender(
        'TestComponent',
        mockRenderFunction
      );

      const result = measuredFunction();

      expect(mockRenderFunction).toHaveBeenCalled();
      expect(result).toBe('Test Result');
      // Performance.now mock should show 100ms difference
      expect(performance.now).toHaveBeenCalledTimes(2);
    });

    it('should measure async operations correctly', async () => {
      const mockAsyncOperation = jest.fn(() => 
        Promise.resolve('Async Result')
      );

      const result = await performanceMonitor.measureAsync('TestOperation', mockAsyncOperation);

      expect(mockAsyncOperation).toHaveBeenCalled();
      expect(result).toBe('Async Result');
      expect(performance.now).toHaveBeenCalledTimes(2);
    });

    it('should create performance-monitored HOC', () => {
      const MonitoredComponent = withPerformanceMonitoring(TestComponent, 'Test');

      render(<MonitoredComponent name="World" />);

      expect(screen.getByText('Hello World')).toBeInTheDocument();
      // Just verify that performance.now was called (React calls it multiple times)
      expect(performance.now).toHaveBeenCalled();
    });
  });

  describe('Utility Functions', () => {
    it('should clear metrics correctly', () => {
      performanceMonitor.clearMetrics();
      const metrics = performanceMonitor.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });

    it('should get metrics correctly', () => {
      const metrics = performanceMonitor.getMetrics();
      expect(typeof metrics).toBe('object');
    });
  });
});