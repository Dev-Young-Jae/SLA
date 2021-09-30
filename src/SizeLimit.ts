// @ts-ignore
import bytes from "bytes";

interface IResult {
  name: string;
  size: number;
  running?: number;
  loading?: number;
  total?: number;
}

class SizeLimit {
  static SIZE_RESULTS_HEADER = ["Branch", "Size"];

  static TIME_RESULTS_HEADER = [
    "Branch",
    "Size",
    "Loading time (3g)",
    "Running time (snapdragon)",
    "Total time"
  ];

  private formatBytes(size: number): string {
    return bytes.format(size, { unitSeparator: " " });
  }

  private formatTime(seconds: number): string {
    if (seconds >= 1) {
      return `${Math.ceil(seconds * 10) / 10} s`;
    }

    return `${Math.ceil(seconds * 1000)} ms`;
  }

  private formatChange(base: number = 0, current: number = 0): string {
    if (base === 0) {
      return "+100% ⬆️";
    }

    const value = ((current - base) / base) * 100;
    const formatted =
      (Math.sign(value) * Math.ceil(Math.abs(value) * 100)) / 100;

    if (value > 0) {
      return `+${formatted}% ⬆️`;
    }

    if (value === 0) {
      return `${formatted}%`;
    }

    return `${formatted}% ⬇️`;
  }

  private formatLine(value: string) {
    return `${value}`;
  }

  private formaComparetLine(value: string, change: string) {
    return `${value} (${change})`;
  }

  private formatTimeResult(name: string, current: IResult): Array<string> {
    return [
      name,
      this.formatLine(this.formatBytes(current.size)),
      this.formatLine(this.formatTime(current.loading)),
      this.formatLine(this.formatTime(current.running)),
      this.formatTime(current.total)
    ];
  }

  private formatCompareResult(name: string, current: IResult, base: IResult) {
    return [
      name,
      this.formaComparetLine(
        this.formatBytes(current.size - base.size),
        this.formatChange(base.size, current.size)
      ),
      this.formaComparetLine(
        this.formatTime(current.loading - base.loading),
        this.formatChange(base.loading, current.loading)
      ),
      this.formaComparetLine(
        this.formatTime(current.running - base.running),
        this.formatChange(base.running, current.running)
      ),
      this.formatTime(current.total + base.total)
    ];
  }

  parseResults(branch: string, output: string): { [name: string]: IResult } {
    const results = JSON.parse(output);

    return results.reduce(
      (current: { [name: string]: IResult }, result: any) => {
        let time = {};
        if (branch) {
          result.name = branch;
        } else {
          result.name = "PR branch";
        }

        if (result.loading !== undefined && result.running !== undefined) {
          const loading = +result.loading;
          const running = +result.running;

          time = {
            running,
            loading,
            total: loading + running
          };
        }

        return {
          ...current,
          [result.name]: {
            name: result.name,
            size: +result.size,
            ...time
          }
        };
      },
      {}
    );
  }

  formatResults(
    base: { [name: string]: IResult },
    current: { [name: string]: IResult }
  ): Array<Array<string>> {
    const names = [...new Set([...Object.keys(base), ...Object.keys(current)])];

    const isSize = names.some(
      (name: string) => current[name] && current[name].total === undefined
    );
    console.log("base >>", base);
    console.log("current >>", current);
    const header = isSize
      ? SizeLimit.SIZE_RESULTS_HEADER
      : SizeLimit.TIME_RESULTS_HEADER;

    const currentKey = Object.keys(current).toString();
    const baseKey = Object.keys(base).toString();

    console.log("baseKey >>", baseKey);
    console.log("currentKey >>", currentKey);

    const currentResult = current[currentKey];
    const baseResult = base[baseKey];

    console.log("baseResult >>", baseResult);
    console.log("currentResult >>", currentResult);

    const masterbranchTable = this.formatTimeResult(baseKey, baseResult);
    const prbranchTable = this.formatTimeResult(currentKey, currentResult);

    const diffTable = this.formatCompareResult(
      "Compare",
      currentResult,
      baseResult
    );

    return [header, masterbranchTable, prbranchTable, diffTable];
  }
}
export default SizeLimit;
