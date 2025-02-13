import * as appInsights from "applicationinsights";

// TODO: Add types when appinsights lib will be added
export const mockTrackEvent = jest.fn();
export const mockTrackDependency = jest.fn();

export const mockedAppinsightsTelemetryClient = {
  trackEvent: mockTrackEvent,
  trackDependency: mockTrackDependency,
} as any as appInsights.TelemetryClient;
