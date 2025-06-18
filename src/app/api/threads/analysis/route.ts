import { NextResponse } from 'next/server';

interface ThreadsPost {
  id: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  shortcode?: string;
  thumbnail_url?: string;
  timestamp?: string;
  username?: string;
  text?: string;
}

interface PostInsights {
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
  views: number;
}

interface PostWithInsights extends ThreadsPost {
  insights: PostInsights;
}

interface UserProfile {
  id: string;
  username: string;
  name?: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
}

interface TopInteractionUser {
  username: string;
  name?: string;
  profile_picture_url?: string;
  total_likes: number;
  total_reposts: number;
  total_replies: number;
  total_interactions: number;
  posts_interacted: number;
}

interface CommentStats {
  totalComments: number;
  totalCommentsOnMyPosts: number;
  totalMyComments: number;
  mostActiveCommenter?: {
    username: string;
    name?: string;
    commentCount: number;
  };
  myMostCommentedPost?: {
    id: string;
    text?: string;
    commentCount: number;
  };
}

export async function POST(request: Request) {
  try {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    const body = await request.json();
    const { accessToken } = body;
    
    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token is required' },
        { status: 400, headers }
      );
    }

    console.log('Starting Threads API analysis...');

    // 1. 사용자 프로필 정보 가져오기 (Threads API)
    console.log('Fetching user profile...');
    const userResponse = await fetch(`https://graph.threads.net/v1.0/me?fields=id,username,name,threads_profile_picture_url,threads_biography&access_token=${accessToken}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
      },
    });
    
    if (!userResponse.ok) {
      const errorText = await userResponse.text();
      console.error('User profile fetch error:', userResponse.status, errorText);
      throw new Error(`사용자 정보를 가져올 수 없습니다 (${userResponse.status}): ${errorText}`);
    }
    
    const userProfile: UserProfile = await userResponse.json();
    console.log('User profile fetched:', userProfile.username);

    // 2. 팔로워 수 조회 (Threads Insights API 사용)
    console.log('Fetching follower count using Threads Insights API...');
    let followerCount = 0;
    
    try {
      // Threads Insights API를 사용하여 팔로워 수 조회
      const insightsResponse = await fetch(`https://graph.threads.net/v1.0/me/threads_insights?metric=followers_count&access_token=${accessToken}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
        },
      });
      
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        console.log('Insights API response:', JSON.stringify(insightsData, null, 2));
        
        // Insights API 응답 구조 처리
        if (insightsData.data && insightsData.data.length > 0) {
          const followersData = insightsData.data.find((item: { name: string }) => item.name === 'followers_count');
          if (followersData && followersData.total_value && followersData.total_value.value !== undefined) {
            followerCount = followersData.total_value.value;
            console.log('Follower count from Insights API:', followerCount);
          }
        }
      } else {
        const errorText = await insightsResponse.text();
        console.error('Insights API failed:', insightsResponse.status, errorText);
        
        // 에러 응답 분석
        try {
          const errorData = JSON.parse(errorText);
          console.error('Insights API error details:', errorData);
        } catch {
          console.error('Could not parse error response');
        }
      }
    } catch (error) {
      console.error('Error fetching follower count from Insights API:', error);
    }
    
    console.log('Final follower count:', followerCount);

    // 3. 사용자의 모든 게시글 가져오기 (페이지네이션 처리)
    console.log('Fetching all posts...');
    let allPosts: ThreadsPost[] = [];
    let nextUrl: string | undefined = `https://graph.threads.net/v1.0/me/threads?fields=id,media_type,media_url,permalink,shortcode,thumbnail_url,timestamp,username,text,children&limit=25&access_token=${accessToken}`;
    
    while (nextUrl && allPosts.length < 25) { // TEXT_POST만 수집하므로 더 많은 페이지 필요
      try {
        const postsResponse: Response = await fetch(nextUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
          },
        });
        
        if (!postsResponse.ok) {
          const errorText = await postsResponse.text();
          console.error('Posts fetch error:', postsResponse.status, errorText);
          
          // 에러 상세 정보 출력
          try {
            const errorData = JSON.parse(errorText);
            console.error('Posts API error details:', errorData);
          } catch {
            console.error('Could not parse posts error response');
          }
          break;
        }
        
        const postsData = await postsResponse.json();
        console.log('Posts API response sample:', JSON.stringify(postsData, null, 2).substring(0, 800) + '...');
        
        const posts = postsData.data || [];
        
        // TEXT_POST 타입만 필터링 (실제 사용자 작성 게시글)
        const textPosts = posts.filter((post: ThreadsPost) => post.media_type === 'TEXT_POST');
        allPosts = [...allPosts, ...textPosts];
        
        nextUrl = postsData.paging?.next;
        console.log(`Fetched ${posts.length} posts (${textPosts.length} text posts), total: ${allPosts.length}`);
        
        // 각 게시글 정보 로깅
        textPosts.forEach((post: ThreadsPost, index: number) => {
          console.log(`Text Post ${index + 1}: ID=${post.id}, Text="${post.text?.substring(0, 50)}...", Timestamp=${post.timestamp}`);
        });
        
        // API 레이트 리밋 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('Error fetching posts batch:', error);
        break;
      }
    }

    console.log(`Total posts fetched: ${allPosts.length}`);
    
    // 게시글이 없는 경우 처리
    if (allPosts.length === 0) {
      console.warn('No posts found. This could mean:');
      console.warn('1. User has no posts');
      console.warn('2. API permissions insufficient for reading posts');
      console.warn('3. Threads API endpoint changed');
      
      // 빈 데이터 반환하되, 팔로워 수는 유지
      return NextResponse.json({
        user: userProfile,
        followerCount,
        totalPosts: 0,
        analyzedPosts: 0,
        totalStats: {
          totalLikes: 0,
          totalReplies: 0,
          totalReposts: 0,
          totalQuotes: 0,
          totalViews: 0
        },
        topPosts: null,
        topCommentUsers: [],
        posts: [],
        _source: 'threads_api_analysis',
        _timestamp: new Date().toISOString(),
        _note: 'No posts available from API'
      }, { headers });
    }

    // 4. 각 게시글의 인사이트 및 댓글 데이터 가져오기
    console.log('Fetching post insights and interactions...');
    const postsWithInsights: PostWithInsights[] = [];
    const interactionUsers: Map<string, TopInteractionUser> = new Map();
    const commentStats: CommentStats = {
      totalComments: 0,
      totalCommentsOnMyPosts: 0,
      totalMyComments: 0
    };
    const commenterCounts: Map<string, { username: string; name?: string; count: number }> = new Map();
    const postCommentCounts: Map<string, { post: ThreadsPost; count: number }> = new Map();

    for (let i = 0; i < Math.min(allPosts.length, 15); i++) { // 최근 15개 게시글만 분석 (API 제한 고려)
      const post = allPosts[i];
      try {
        console.log(`Processing post ${i + 1}/${Math.min(allPosts.length, 15)}: ${post.id}`);
        
        // 게시글 인사이트 가져오기
        const insightsResponse = await fetch(`https://graph.threads.net/v1.0/${post.id}/insights?metric=likes,replies,reposts,quotes,views&access_token=${accessToken}`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
          },
        });
        
        let insights: PostInsights = { likes: 0, replies: 0, reposts: 0, quotes: 0, views: 0 };
        
        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          console.log(`Post ${post.id} insights sample:`, JSON.stringify(insightsData, null, 2).substring(0, 300) + '...');
          
          const insightsList = insightsData.data || [];
          
          // 새로운 응답 구조에 맞게 수정 (total_value 사용)
          const metricsMap = insightsList.reduce((acc: Record<string, number>, insight: { name: string; total_value?: { value?: number }; values?: Array<{ value?: number }> }) => {
            // total_value가 있으면 그것을 사용, 없으면 기존 values 방식 사용
            if (insight.total_value && insight.total_value.value !== undefined) {
              acc[insight.name] = insight.total_value.value;
            } else if (insight.values && insight.values.length > 0) {
              acc[insight.name] = insight.values[0]?.value || 0;
            }
            return acc;
          }, {});
          
          insights = {
            likes: metricsMap.likes || 0,
            replies: metricsMap.replies || 0,
            reposts: metricsMap.reposts || 0,
            quotes: metricsMap.quotes || 0,
            views: metricsMap.views || 0
          };
          
          console.log(`Post ${post.id} parsed insights:`, insights);
        } else {
          const errorText = await insightsResponse.text();
          console.warn(`Post insights failed for ${post.id}:`, insightsResponse.status, errorText);
        }

        // 댓글 작성자 데이터 수집 (실제 Threads API 사용)
        try {
          const conversationResponse = await fetch(`https://graph.threads.net/v1.0/${post.id}/conversation?fields=id,username,text,timestamp&access_token=${accessToken}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; ThreadTracker/1.0)',
            },
          });
          
          if (conversationResponse.ok) {
            const conversationData = await conversationResponse.json();
            console.log(`Conversation data for ${post.id}:`, JSON.stringify(conversationData, null, 2).substring(0, 300) + '...');
            
            const replies = conversationData.data || [];
            console.log(`Found ${replies.length} replies for post ${post.id}`);
            
            // 댓글 통계 업데이트
            commentStats.totalCommentsOnMyPosts += replies.length;
            commentStats.totalComments += replies.length;
            
            // 이 게시글의 댓글 수 기록
            postCommentCounts.set(post.id, { post, count: replies.length });
            
            // 댓글 작성자들을 수집
            replies.forEach((reply: { username: string; id: string; text?: string }) => {
              if (reply.username) {
                // 내가 단 댓글인지 확인
                if (reply.username === userProfile.username) {
                  commentStats.totalMyComments += 1;
                } else {
                  // 다른 사용자가 내 게시글에 단 댓글
                  const existingUser = interactionUsers.get(reply.username) || {
                    username: reply.username,
                    name: reply.username,
                    profile_picture_url: '',
                    total_likes: 0,
                    total_reposts: 0,
                    total_replies: 0,
                    total_interactions: 0,
                    posts_interacted: 0
                  };

                  existingUser.total_replies += 1;
                  existingUser.total_interactions += 1;
                  if (!existingUser.posts_interacted || existingUser.posts_interacted === 0) {
                    existingUser.posts_interacted = 1;
                  } else {
                    existingUser.posts_interacted += 1;
                  }
                  interactionUsers.set(reply.username, existingUser);
                  
                  // 댓글 작성자별 통계
                  const commenter = commenterCounts.get(reply.username) || {
                    username: reply.username,
                    name: reply.username,
                    count: 0
                  };
                  commenter.count += 1;
                  commenterCounts.set(reply.username, commenter);
                  
                  console.log(`Added comment from user: ${reply.username} (total comments: ${existingUser.total_replies})`);
                }
              }
            });
          } else {
            const errorText = await conversationResponse.text();
            console.warn(`Conversation API failed for post ${post.id}:`, conversationResponse.status, errorText);
            
            // 에러 분석
            try {
              const errorData = JSON.parse(errorText);
              console.error('Conversation API error details:', errorData);
            } catch {
              console.error('Could not parse conversation error response');
            }
          }
        } catch (error) {
          console.warn(`Error fetching conversation for post ${post.id}:`, error);
        }

        postsWithInsights.push({
          ...post,
          insights
        });

        // API 레이트 리밋 방지 (Threads API는 엄격한 제한이 있음)
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        console.log(`✓ Completed processing post ${i + 1}/${Math.min(allPosts.length, 15)}`);
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error);
        // 에러가 발생해도 계속 진행
        postsWithInsights.push({
          ...post,
          insights: { likes: 0, replies: 0, reposts: 0, quotes: 0, views: 0 }
        });
      }
    }

    // 5. 댓글 통계 완성
    // 가장 활발한 댓글 작성자 찾기
    const mostActiveCommenter = Array.from(commenterCounts.values())
      .sort((a, b) => b.count - a.count)[0];
    if (mostActiveCommenter) {
      commentStats.mostActiveCommenter = {
        username: mostActiveCommenter.username,
        name: mostActiveCommenter.name,
        commentCount: mostActiveCommenter.count
      };
    }
    
    // 가장 댓글이 많은 내 게시글 찾기
    const mostCommentedPost = Array.from(postCommentCounts.values())
      .sort((a, b) => b.count - a.count)[0];
    if (mostCommentedPost && mostCommentedPost.count > 0) {
      commentStats.myMostCommentedPost = {
        id: mostCommentedPost.post.id,
        text: mostCommentedPost.post.text,
        commentCount: mostCommentedPost.count
      };
    }
    
    console.log('Comment Statistics:', commentStats);
    
    // 6. 댓글을 많이 단 사용자 정렬
    console.log(`Total comment users found: ${interactionUsers.size}`);
    console.log('Sample comment users:', Array.from(interactionUsers.entries()).slice(0, 3));
    
    const topCommentUsers = Array.from(interactionUsers.values())
      .filter(user => user.total_replies > 0) // 댓글을 단 사용자만 필터링
      .sort((a, b) => b.total_replies - a.total_replies) // 댓글 수로 정렬
      .slice(0, 10);
      
    console.log('Top comment users:', topCommentUsers.length, topCommentUsers.slice(0, 3));

    // 7. 전체 통계 계산
    const totalStats = postsWithInsights.reduce((acc, post) => {
      acc.totalLikes += post.insights.likes;
      acc.totalReplies += post.insights.replies;
      acc.totalReposts += post.insights.reposts;
      acc.totalQuotes += post.insights.quotes;
      acc.totalViews += post.insights.views;
      return acc;
    }, {
      totalLikes: 0,
      totalReplies: 0,
      totalReposts: 0,
      totalQuotes: 0,
      totalViews: 0
    });

    // 8. 상위 게시글 찾기
    const topPosts = {
      mostLiked: postsWithInsights.length > 0 ? postsWithInsights.reduce((max, post) => 
        post.insights.likes > max.insights.likes ? post : max, postsWithInsights[0]) : null,
      mostReposted: postsWithInsights.length > 0 ? postsWithInsights.reduce((max, post) => 
        post.insights.reposts > max.insights.reposts ? post : max, postsWithInsights[0]) : null,
      mostReplied: postsWithInsights.length > 0 ? postsWithInsights.reduce((max, post) => 
        post.insights.replies > max.insights.replies ? post : max, postsWithInsights[0]) : null,
    };
    
    // 상위 게시글 로깅
    if (topPosts.mostLiked) {
      console.log('Most liked post:', {
        id: topPosts.mostLiked.id,
        text: topPosts.mostLiked.text?.substring(0, 100),
        likes: topPosts.mostLiked.insights.likes
      });
    }
    if (topPosts.mostReposted) {
      console.log('Most reposted post:', {
        id: topPosts.mostReposted.id,
        text: topPosts.mostReposted.text?.substring(0, 100),
        reposts: topPosts.mostReposted.insights.reposts
      });
    }
    if (topPosts.mostReplied) {
      console.log('Most replied post:', {
        id: topPosts.mostReplied.id,
        text: topPosts.mostReplied.text?.substring(0, 100),
        replies: topPosts.mostReplied.insights.replies
      });
    }

    console.log('Analysis completed successfully');

    return NextResponse.json({
      user: userProfile,
      followerCount,
      totalPosts: allPosts.length,
      analyzedPosts: postsWithInsights.length,
      totalStats,
      topPosts,
      topCommentUsers,
      commentStats,
      posts: postsWithInsights.slice(0, 20), // 최근 20개만 반환
      _source: 'threads_api_analysis',
      _timestamp: new Date().toISOString()
    }, { headers });
    
  } catch (error) {
    console.error('Threads Analysis API error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Threads 분석 API 호출 실패',
        details: errorMessage,
        _timestamp: new Date().toISOString()
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