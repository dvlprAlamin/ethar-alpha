import cron from 'node-cron';
import { stockService } from './stockService';
import logger from '../utils/logger';

class SchedulerService {
  private stockUpdateJob: cron.ScheduledTask | null = null;
  private isRunning = false;

  constructor() {
    this.initializeScheduler();
  }

  private initializeScheduler(): void {
    try {
      // Schedule stock updates every 1.5 hours (90 minutes)
      // This ensures we stay within API rate limits (25 requests per day)
      // Cron pattern: '0 */90 * * *' means every 90 minutes
      // Alternative: '0 0,2,4,6,8,10,12,14,16,18,20,22 * * *' for every 2 hours

      this.stockUpdateJob = cron.schedule(
        '0 */90 * * *',
        async () => {
          if (this.isRunning) {
            logger.warn(
              'Stock update job is already running, skipping this execution'
            );
            return;
          }

          this.isRunning = true;
          logger.info('Starting scheduled stock data update job');

          try {
            await stockService.updateAllStocks();
            logger.info('Scheduled stock data update completed successfully');
          } catch (error) {
            logger.error('Error during scheduled stock update:', error);
          } finally {
            this.isRunning = false;
          }
        },
        {
          scheduled: false, // Don't start immediately
          timezone: 'UTC',
        }
      );

      logger.info('Stock update scheduler initialized (every 90 minutes)');
    } catch (error) {
      logger.error('Error initializing scheduler:', error);
    }
  }

  startScheduler(): void {
    try {
      if (this.stockUpdateJob && !this.isRunning) {
        this.stockUpdateJob.start();
        logger.info('Stock update scheduler started');

        // Run initial update after 5 minutes to populate database
        setTimeout(async () => {
          if (!this.isRunning) {
            logger.info('Running initial stock data update');
            this.isRunning = true;
            try {
              await stockService.updateAllStocks();
              logger.info('Initial stock data update completed');
            } catch (error) {
              logger.error('Error during initial stock update:', error);
            } finally {
              this.isRunning = false;
            }
          }
        }, 5 * 60 * 1000); // 5 minutes delay
      } else {
        logger.warn(
          'Stock update scheduler is already running or not initialized'
        );
      }
    } catch (error) {
      logger.error('Error starting scheduler:', error);
    }
  }

  stopScheduler(): void {
    try {
      if (this.stockUpdateJob && this.isRunning) {
        this.stockUpdateJob.stop();
        logger.info('Stock update scheduler stopped');
      } else {
        logger.warn('Stock update scheduler is not running');
      }
    } catch (error) {
      logger.error('Error stopping scheduler:', error);
    }
  }

  getSchedulerStatus(): {
    isSchedulerRunning: boolean;
    isUpdateRunning: boolean;
    nextExecution: string | null;
  } {
    return {
      isSchedulerRunning: this.stockUpdateJob ? this.isRunning : false,
      isUpdateRunning: this.isRunning,
      nextExecution:
        this.stockUpdateJob && this.isRunning
          ? 'Next execution in ~90 minutes'
          : null,
    };
  }

  async manualStockUpdate(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Stock update is already in progress');
    }

    this.isRunning = true;
    logger.info('Starting manual stock data update');

    try {
      await stockService.updateAllStocks();
      logger.info('Manual stock data update completed successfully');
    } catch (error) {
      logger.error('Error during manual stock update:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  // Alternative scheduling options for different update frequencies
  setCustomSchedule(cronPattern: string): void {
    try {
      if (this.stockUpdateJob) {
        this.stockUpdateJob.stop();
      }

      this.stockUpdateJob = cron.schedule(
        cronPattern,
        async () => {
          if (this.isRunning) {
            logger.warn(
              'Stock update job is already running, skipping this execution'
            );
            return;
          }

          this.isRunning = true;
          logger.info(
            'Starting scheduled stock data update job (custom schedule)'
          );

          try {
            await stockService.updateAllStocks();
            logger.info('Scheduled stock data update completed successfully');
          } catch (error) {
            logger.error('Error during scheduled stock update:', error);
          } finally {
            this.isRunning = false;
          }
        },
        {
          scheduled: true,
          timezone: 'UTC',
        }
      );

      logger.info(`Custom stock update schedule set: ${cronPattern}`);
    } catch (error) {
      logger.error('Error setting custom schedule:', error);
      throw error;
    }
  }

  // Predefined schedule options
  setHourlySchedule(): void {
    this.setCustomSchedule('0 0 * * * *'); // Every hour
  }

  setEvery2HoursSchedule(): void {
    this.setCustomSchedule('0 0 */2 * * *'); // Every 2 hours
  }

  setEvery90MinutesSchedule(): void {
    this.setCustomSchedule('0 */90 * * *'); // Every 90 minutes (default)
  }

  // Graceful shutdown
  shutdown(): void {
    try {
      if (this.stockUpdateJob) {
        this.stockUpdateJob.stop();
        logger.info('Scheduler service shut down gracefully');
      }
    } catch (error) {
      logger.error('Error during scheduler shutdown:', error);
    }
  }
}

export const schedulerService = new SchedulerService();
export default schedulerService;
