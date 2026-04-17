import { Component, ErrorInfo, ReactNode, PropsWithChildren } from 'react';
import { AlertTriangle } from 'lucide-react';

/**
 * ErrorBoundaryの状態を管理するインターフェース
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Reactエラーバウンダリコンポーネント
 * コンポーネントツリー内で発生したエラーをキャッチし、
 * ユーザーフレンドリーなエラーUIを表示する
 */
export class ErrorBoundary extends Component<PropsWithChildren, ErrorBoundaryState> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  /**
   * エラーが発生したときに状態を更新する静的メソッド
   * @param error - キャッチしたエラー
   * @returns 新しい状態
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  /**
   * エラー発生時に詳細情報をログ出力する
   * @param error - キャッチしたエラー
   * @param errorInfo - Reactが提供するエラー情報（コンポーネントスタックなど）
   */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  /**
   * ページをリロードしてエラー状態をリセットする
   */
  handleReload = (): void => {
    window.location.reload();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center justify-center mb-6">
              <AlertTriangle className="text-red-600" size={48} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">
              エラーが発生しました
            </h1>
            <p className="text-gray-600 text-center mb-6">
              申し訳ございません。アプリケーションでエラーが発生しました。
              <br />
              ページを再読み込みして再度お試しください。
            </p>
            {this.state.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-mono break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReload}
              className="w-full bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
