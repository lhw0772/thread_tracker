import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // CORS 헤더 설정
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // OPTIONS 요청 처리 (CORS preflight)
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 200, headers });
    }

    const body = await request.json();
    const { accessToken } = body;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400, headers }
      );
    }

    // 1. 사용자 프로필 정보 가져오기
    const userResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url&access_token=${accessToken}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
      },
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User profile fetch error:', userResponse.status, errorText);
      throw new Error(`사용자 정보를 가져올 수 없습니다 (${userResponse.status})`);
    }
    
    const userProfile = await userResponse.json();

    // 2. 팔로워 수 조회 (User Insights API)
    const followerInsightsResponse = await fetch(`https://graph.threads.net/v1.0/${userProfile.id}/threads_insights?metric=followers_count&access_token=${accessToken}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
      },
    });
    
    let totalFollowers = 0;
    if (followerInsightsResponse.ok) {
      const followerData = await followerInsightsResponse.json();
      totalFollowers = followerData.data?.[0]?.values?.[0]?.value || 0;
    }

    // 3. 사용자의 게시글 목록 가져오기
    const postsResponse = await fetch(`https://graph.threads.net/v1.0/me/threads?fields=id,media_type,media_url,permalink,shortcode,thumbnail_url,timestamp,username,text&limit=25&access_token=${accessToken}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
      },
    });
    
    let posts = [];
    if (postsResponse.ok) {
      const postsData = await postsResponse.json();
      posts = postsData.data || [];
    }

    // 4. 각 게시글의 인사이트 데이터 가져오기
    const postsWithInsights = await Promise.all(
      posts.map(async (post: { id: string; [key: string]: unknown }) => {
        try {
          const insightsResponse = await fetch(`https://graph.threads.net/v1.0/${post.id}/insights?metric=likes,replies,reposts,quotes,views&access_token=${accessToken}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
            },
          });
          
          if (insightsResponse.ok) {
            const insightsData = await insightsResponse.json();
            const insights = insightsData.data || [];
            
            const metrics = insights.reduce((acc: Record<string, number>, insight: { name: string; values?: Array<{ value?: number }> }) => {
              acc[insight.name] = insight.values?.[0]?.value || 0;
              return acc;
            }, {});
            
            return {
              ...post,
              insights: {
                likes: metrics.likes || 0,
                replies: metrics.replies || 0,
                reposts: metrics.reposts || 0,
                quotes: metrics.quotes || 0,
                views: metrics.views || 0
              }
            };
          }
        } catch (error) {
          console.error(`Error fetching insights for post ${post.id}:`, error);
        }
        
        return {
          ...post,
          insights: {
            likes: 0,
            replies: 0,
            reposts: 0,
            quotes: 0,
            views: 0
          }
        };
      })
    );

    // 5. 전체 인게이지먼트 통계 계산 (안전한 처리)
    const totalStats = postsWithInsights.reduce((acc, post) => {
      acc.totalLikes += post.insights?.likes || 0;
      acc.totalReplies += post.insights?.replies || 0;
      acc.totalReposts += post.insights?.reposts || 0;
      acc.totalQuotes += post.insights?.quotes || 0;
      acc.totalViews += post.insights?.views || 0;
      return acc;
    }, {
      totalLikes: 0,
      totalReplies: 0,
      totalReposts: 0,
      totalQuotes: 0,
      totalViews: 0
    });

    // 6. 상위 게시글 찾기 (안전한 처리)
    let topLikedPost = null;
    let topRepostedPost = null;
    let topRepliedPost = null;
    
    if (postsWithInsights.length > 0) {
      topLikedPost = postsWithInsights.reduce((max, post) => 
        (post.insights?.likes || 0) > (max.insights?.likes || 0) ? post : max, postsWithInsights[0]);
      
      topRepostedPost = postsWithInsights.reduce((max, post) => 
        (post.insights?.reposts || 0) > (max.insights?.reposts || 0) ? post : max, postsWithInsights[0]);
      
      topRepliedPost = postsWithInsights.reduce((max, post) => 
        (post.insights?.replies || 0) > (max.insights?.replies || 0) ? post : max, postsWithInsights[0]);
    }
    
    return NextResponse.json({
      user: userProfile,
      totalFollowers,
      totalPosts: posts.length,
      totalStats,
      topPosts: {
        mostLiked: topLikedPost,
        mostReposted: topRepostedPost,
        mostReplied: topRepliedPost
      },
      posts: postsWithInsights,
      _source: 'threads_api'
    }, { headers });
    
  } catch (error) {
    console.error('Threads API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Threads API 호출 실패',
        details: errorMessage
      },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }}
    );
  }
}

// OPTIONS 요청 처리
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}