import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Mock 데이터 - 테스트용
    const mockData = {
      user: {
        id: "12345678901234567",
        username: "test_user",
        name: "Test User",
        threads_profile_picture_url: "https://example.com/profile.jpg"
      },
      followerCount: 1245,
      totalPosts: 23,
      analyzedPosts: 23,
      totalStats: {
        totalLikes: 8920,
        totalReplies: 234,
        totalReposts: 156,
        totalQuotes: 45,
        totalViews: 45230
      },
      topInteractionUsers: [
        {
          username: "super_fan_1",
          name: "Super Fan",
          profile_picture_url: "",
          total_likes: 25,
          total_reposts: 8,
          total_replies: 12,
          total_interactions: 45,
          posts_interacted: 15
        },
        {
          username: "active_follower",
          name: "Active Follower",
          profile_picture_url: "",
          total_likes: 18,
          total_reposts: 5,
          total_replies: 15,
          total_interactions: 38,
          posts_interacted: 12
        },
        {
          username: "loyal_supporter",
          name: "Loyal Supporter",
          profile_picture_url: "",
          total_likes: 22,
          total_reposts: 3,
          total_replies: 8,
          total_interactions: 33,
          posts_interacted: 18
        },
        {
          username: "engaged_user",
          name: "Engaged User",
          profile_picture_url: "",
          total_likes: 15,
          total_reposts: 7,
          total_replies: 6,
          total_interactions: 28,
          posts_interacted: 10
        },
        {
          username: "regular_commenter",
          name: "Regular Commenter",
          profile_picture_url: "",
          total_likes: 12,
          total_reposts: 2,
          total_replies: 11,
          total_interactions: 25,
          posts_interacted: 8
        }
      ],
      topPosts: {
        mostLiked: {
          id: "post1",
          text: "가장 인기 있는 게시글입니다! 🔥",
          insights: { likes: 2340, replies: 45, reposts: 23, quotes: 12, views: 8900 }
        },
        mostReposted: {
          id: "post2", 
          text: "많이 공유된 게시글입니다 ⭐",
          insights: { likes: 890, replies: 12, reposts: 156, quotes: 8, views: 4500 }
        },
        mostReplied: {
          id: "post3",
          text: "댓글이 많은 게시글입니다 💬", 
          insights: { likes: 560, replies: 234, reposts: 34, quotes: 15, views: 3200 }
        }
      },
      posts: [
        {
          id: "post1",
          text: "가장 인기 있는 게시글입니다! 🔥",
          timestamp: "2024-06-15T10:30:00Z",
          insights: { likes: 2340, replies: 45, reposts: 23, quotes: 12, views: 8900 }
        },
        {
          id: "post2",
          text: "많이 공유된 게시글입니다 ⭐",
          timestamp: "2024-06-14T15:20:00Z", 
          insights: { likes: 890, replies: 12, reposts: 156, quotes: 8, views: 4500 }
        },
        {
          id: "post3",
          text: "댓글이 많은 게시글입니다 💬",
          timestamp: "2024-06-13T09:15:00Z",
          insights: { likes: 560, replies: 234, reposts: 34, quotes: 15, views: 3200 }
        },
        {
          id: "post4",
          text: "일반적인 게시글입니다",
          timestamp: "2024-06-12T14:45:00Z",
          insights: { likes: 234, replies: 8, reposts: 12, quotes: 3, views: 1200 }
        }
      ],
      _source: 'mock_data',
      _timestamp: new Date().toISOString()
    };

    await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 지연으로 실제 API 호출 시뮬레이션

    return NextResponse.json(mockData, { headers });
    
  } catch (error) {
    console.error('Mock API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Mock 데이터 생성 실패',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }}
    );
  }
}

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