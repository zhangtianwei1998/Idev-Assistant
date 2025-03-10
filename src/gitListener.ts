import * as vscode from "vscode";

type BranchChangeCallback = (
  currentBranch: string,
  previousBranch: string,
  repoPath: string
) => void;

export class GitBranchWatcher {
  private git: any;
  private disposables: vscode.Disposable[] = [];
  private callbacks: BranchChangeCallback[] = [];
  private branchMap = new Map<string, string>();
  private retryTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeWithRetry();
  }

  private async initializeWithRetry(retryCount = 0) {
    try {
      const gitExtension = vscode.extensions.getExtension("vscode.git");

      if (!gitExtension) {
        if (retryCount === 0) {
          vscode.window.showErrorMessage(
            "Git extension not found. Please install/enable Git extension."
          );
        }
        this.scheduleRetry(retryCount);
        return;
      }

      if (!gitExtension.isActive) {
        await gitExtension.activate();
      }

      this.git = gitExtension.exports.getAPI(1);
      this.setupRepositoryListeners();
      this.git.repositories.forEach((repo: any) => this.watchRepository(repo));
    } catch (error) {
      console.error("Git initialization failed:", error);
      this.scheduleRetry(retryCount);
    }
  }

  private scheduleRetry(retryCount: number) {
    if (retryCount < 5) {
      this.retryTimer = setTimeout(() => {
        this.initializeWithRetry(retryCount + 1);
      }, 3000 * (retryCount + 1));
    }
  }

  private setupRepositoryListeners() {
    this.disposables.push(
      this.git.onDidOpenRepository((repo: any) => {
        this.watchRepository(repo);
      })
    );
  }

  private watchRepository(repo: any) {
    const repoPath = repo.rootUri.path;
    this.branchMap.set(repoPath, repo.state.HEAD?.name || "");

    const disposable = repo.state.onDidChange(() => {
      this.handleStateChange(repo);
    });

    this.disposables.push(disposable);
  }

  private handleStateChange(repo: any) {
    const repoPath = repo.rootUri.path;
    const currentBranch = repo.state.HEAD?.name || "";
    const previousBranch = this.branchMap.get(repoPath) || "";

    if (currentBranch !== previousBranch) {
      this.branchMap.set(repoPath, currentBranch);
      this.triggerCallbacks(currentBranch, previousBranch, repoPath);
    }
  }

  private triggerCallbacks(current: string, previous: string, repoPath: string) {
    this.callbacks.forEach((callback) => callback(current, previous, repoPath));
  }

  public onBranchChange(callback: BranchChangeCallback) {
    this.callbacks.push(callback);
    return new vscode.Disposable(() => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    });
  }

  public dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.callbacks = [];
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
  }
}
