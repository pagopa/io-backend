/**
 * This service post a notification to the Notification hub.
 */

import { Notification } from "../types/notification";

export default class NotificationService {
  public async postNotification(_: Notification): Promise<void> {
    // TODO will be implemented by https://www.pivotaltracker.com/story/show/155934439
  }
}
