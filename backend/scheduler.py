import sys
import os
import time

# This ensures that we can import modules from the 'core' and 'utils' directories
sys.path.append(os.getcwd())

from main import check_and_run_scheduled_scans, log_with_timestamp

def run_scheduler_continuously():
    """
    This function runs in a loop to act as a simple scheduler,
    checking for due scans every 60 seconds.
    """
    log_with_timestamp("Scheduler process started by PM2.")
    while True:
        try:
            check_and_run_scheduled_scans()
        except Exception as e:
            log_with_timestamp(f"An error occurred in the scheduler loop: {e}")
        
        # Wait for 60 seconds before the next check
        time.sleep(60)

if __name__ == "__main__":
    run_scheduler_continuously()
