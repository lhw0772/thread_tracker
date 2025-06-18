"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import Image from "next/image";

export default function Home() {
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await signIn("threads", { callbackUrl: "/" });
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
  };


  // 로딩 중일 때
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 로그인되지 않은 경우
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          <div className="text-center">
            <div className="text-6xl mb-6">🧵</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Thread Tracker</h1>
            <p className="text-gray-600 mb-8">
              Threads 계정으로 OAuth 로그인하여 데이터를 확인하세요
            </p>
            
            <div className="space-y-4">
              <button
                onClick={handleLogin}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    로그인 중...
                  </>
                ) : (
                  <>
                    <div className="text-2xl mr-2">🧵</div>
                    Threads OAuth 로그인
                  </>
                )}
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">🔐 OAuth 로그인 정보:</h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• 안전한 OAuth 2.0 인증 사용</li>
                  <li>• Threads 계정으로 직접 로그인</li>
                  <li>• 자동으로 필요한 권한 요청</li>
                  <li>• 토큰 관리 자동화</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="text-sm font-medium text-green-900 mb-2">✅ 지원하는 기능:</h3>
                <ul className="text-xs text-green-800 space-y-1">
                  <li>• 팔로워 수 및 기본 통계</li>
                  <li>• 게시글 분석 및 인사이트</li>
                  <li>• 상위 인터랙션 사용자 분석</li>
                  <li>• 실시간 데이터 업데이트</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 로그인된 경우
  return <MainApp session={session} onLogout={handleLogout} />;
}

function MainApp({ session, onLogout }: { session: { accessToken?: string; user?: { name?: string | null; email?: string | null; image?: string | null; username?: string } }; onLogout: () => void }) {
  const [data, setData] = useState<{
    user?: { username?: string; name?: string; threads_profile_picture_url?: string };
    followerCount?: number;
    totalPosts?: number;
    analyzedPosts?: number;
    totalStats?: { totalLikes?: number; totalReposts?: number; totalReplies?: number; totalViews?: number };
    topCommentUsers?: Array<{
      username: string;
      name?: string;
      profile_picture_url?: string;
      total_likes: number;
      total_reposts: number;
      total_replies: number;
      total_interactions: number;
      posts_interacted: number;
    }>;
    topPosts?: {
      mostLiked?: { text?: string; insights: { likes: number } };
      mostReposted?: { text?: string; insights: { reposts: number } };
      mostReplied?: { text?: string; insights: { replies: number } };
    };
    _source?: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    
    try {
      // OAuth 로그인이므로 항상 실제 분석 API 사용
      const apiEndpoint = '/api/threads/analysis';
      
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessToken: session.accessToken })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.details || errorData.error || `HTTP ${response.status}: 데이터를 가져오는데 실패했습니다`;
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다';
      setError(`데이터 로딩 실패: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [session?.accessToken]);

  useEffect(() => {
    if (session?.accessToken) {
      fetchData();
    }
  }, [session?.accessToken, fetchData]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">🧵 Thread Tracker</h1>
              {session.user?.image && (
                <Image 
                  src={session.user.image} 
                  alt="Profile" 
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600">
                {session.user?.name || session.user?.email}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">오류 발생:</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={fetchData}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">총 팔로워</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {(() => {
                    if (loading) return '-';
                    if (!data) return '조회 중';
                    if (data.followerCount === undefined) return '데이터 없음';
                    return data.followerCount.toLocaleString();
                  })()}
                </p>
                <p className="text-sm text-gray-600">followers</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">총 게시글</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-green-600">
                  {loading ? '-' : (data?.totalPosts || 0)}
                </p>
                <p className="text-sm text-gray-600">posts</p>
                {data?.analyzedPosts && (
                  <p className="text-xs text-gray-500">({data.analyzedPosts}개 분석됨)</p>
                )}
              </div>
              <div className="text-4xl">📝</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">총 좋아요</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-red-600">
                  {loading ? '-' : (data?.totalStats?.totalLikes || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">likes</p>
              </div>
              <div className="text-4xl">❤️</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">총 조회수</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-purple-600">
                  {loading ? '-' : (data?.totalStats?.totalViews || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">views</p>
              </div>
              <div className="text-4xl">👁️</div>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
          >
            {loading ? '데이터 로딩 중...' : '📊 데이터 새로고침'}
          </button>
        </div>

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Threads API에서 데이터를 가져오는 중...</p>
          </div>
        )}

        {data && !loading && (
          <div className="space-y-6">
            {/* 사용자 정보 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">사용자 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">사용자명</p>
                  <p className="font-medium">{data.user?.username || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">이름</p>
                  <p className="font-medium">{data.user?.name || 'N/A'}</p>
                </div>
              </div>
              {data._source && (
                <div className="mt-4 text-xs text-gray-500">
                  데이터 소스: {data._source === 'threads_api_analysis' ? 'Threads API (실시간)' : 'Mock 데이터'}
                  {data._source === 'threads_api_analysis' && data.followerCount === 0 && (
                    <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                      ℹ️ 팔로워 수가 0으로 표시되는 경우:
                      <br />• 실제로 팔로워가 0명이거나
                      <br />• API 권한이 부족할 수 있습니다
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 댓글을 많이 단 사용자 */}
            {data.topCommentUsers && data.topCommentUsers.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  💬 댓글을 많이 단 사용자 Top 10
                </h3>
                <div className="space-y-4">
                  {data.topCommentUsers.slice(0, 10).map((user, index) => (
                    <div key={user.username} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">@{user.username}</p>
                          {user.name && user.name !== user.username && (
                            <p className="text-sm text-gray-600">{user.name}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{user.total_replies}개 댓글</p>
                        <p className="text-xs text-gray-500">{user.posts_interacted}개 게시글에 참여</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 상위 게시글 */}
            {data.topPosts && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 인기 게시글</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {data.topPosts.mostLiked && (
                    <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                      <h4 className="font-semibold text-red-800 mb-2">❤️ 가장 많은 좋아요</h4>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                        {data.topPosts.mostLiked.text || '내용 없음'}
                      </p>
                      <p className="text-lg font-bold text-red-600">
                        {data.topPosts.mostLiked.insights.likes.toLocaleString()} 좋아요
                      </p>
                    </div>
                  )}
                  
                  {data.topPosts.mostReposted && (
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">🔄 가장 많은 리포스트</h4>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                        {data.topPosts.mostReposted.text || '내용 없음'}
                      </p>
                      <p className="text-lg font-bold text-green-600">
                        {data.topPosts.mostReposted.insights.reposts.toLocaleString()} 리포스트
                      </p>
                    </div>
                  )}
                  
                  {data.topPosts.mostReplied && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">💬 가장 많은 댓글</h4>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-3">
                        {data.topPosts.mostReplied.text || '내용 없음'}
                      </p>
                      <p className="text-lg font-bold text-blue-600">
                        {data.topPosts.mostReplied.insights.replies.toLocaleString()} 댓글
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}