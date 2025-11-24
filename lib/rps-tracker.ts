interface RequestData {
  timestamp: number;
  second: number;
}

class RPSTracker {
  private requests: RequestData[] = [];
  private startTime: number = Date.now();
  private requestsPerSecond: Map<number, number> = new Map();

  trackRequest(): void {
    const timestamp = Date.now();
    const second = Math.floor((timestamp - this.startTime) / 1000);

    this.requests.push({ timestamp, second });
    this.requestsPerSecond.set(second, (this.requestsPerSecond.get(second) || 0) + 1);
  }

  getReport(): string {
    if (this.requests.length === 0) {
      return "\n=== RPS Report ===\nNo requests received\n==================\n";
    }

    const totalRequests = this.requests.length;
    const elapsedTime = (Date.now() - this.startTime) / 1000;
    const averageRPS = elapsedTime > 0 ? (totalRequests / elapsedTime).toFixed(2) : "0";

    let report = "\n=== RPS Report ===\n";
    report += `Total Requests: ${totalRequests}\n`;
    report += `Elapsed Time: ${elapsedTime.toFixed(2)}s\n`;
    report += `Average RPS: ${averageRPS}\n`;
    report += "\n--- Requests Per Second ---\n";

    const sortedSeconds = Array.from(this.requestsPerSecond.keys()).sort((a, b) => a - b);

    for (const second of sortedSeconds) {
      const count = this.requestsPerSecond.get(second) || 0;
      report += `Second ${second}: ${count} request${count !== 1 ? "s" : ""}\n`;
    }

    report += "===========================\n";
    return report;
  }

  reset(): void {
    this.requests = [];
    this.startTime = Date.now();
    this.requestsPerSecond.clear();
  }
}

export const rpsTracker = new RPSTracker();
