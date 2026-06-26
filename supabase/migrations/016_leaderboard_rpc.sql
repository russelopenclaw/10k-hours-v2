-- Migration 016: Leaderboard RPC functions
-- Part of T-156: Studio leaderboard with 7/30 day rolling windows
--
-- Two RPC functions:
-- 1. get_leaderboard_7d: Coins earned in last 7 days, teacher-scoped
-- 2. get_leaderboard_30d: Coins earned in last 30 days, teacher-scoped
-- Uses display_name (or falls back to full_name or email prefix) for anonymity.

CREATE OR REPLACE FUNCTION get_leaderboard_7d(p_teacher_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  instrument TEXT,
  total_coins_earned BIGINT,
  practice_days BIGINT,
  current_streak BIGINT
) AS $$
  WITH seven_day_sessions AS (
    SELECT
      ps.user_id,
      SUM(ps.coins_earned) AS total_coins,
      COUNT(DISTINCT DATE(ps.created_at)) AS days
    FROM practice_sessions ps
    INNER JOIN teacher_students ts ON ts.student_id = ps.user_id AND ts.teacher_id = p_teacher_id
    WHERE ps.created_at >= NOW() - INTERVAL '7 days'
    GROUP BY ps.user_id
  ),
  streak_calc AS (
    SELECT
      ps.user_id,
      COUNT(DISTINCT DATE(ps.created_at)) AS streak
    FROM practice_sessions ps
    INNER JOIN teacher_students ts ON ts.student_id = ps.user_id AND ts.teacher_id = p_teacher_id
    WHERE ps.created_at >= (
      SELECT MIN(d) FROM (
        SELECT DISTINCT DATE(created_at) AS d
        FROM practice_sessions
        WHERE user_id IN (SELECT student_id FROM teacher_students WHERE teacher_id = p_teacher_id)
        ORDER BY d DESC
        LIMIT 30
      ) sub
    )
    GROUP BY ps.user_id
  )
  SELECT
    p.id AS user_id,
    COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), SPLIT_PART(p.email, '@', 1)) AS display_name,
    p.instrument,
    COALESCE(sds.total_coins, 0) AS total_coins_earned,
    COALESCE(sds.days, 0) AS practice_days,
    COALESCE(sc.streak, 0) AS current_streak
  FROM profiles p
  INNER JOIN teacher_students ts ON ts.student_id = p.id AND ts.teacher_id = p_teacher_id
  LEFT JOIN seven_day_sessions sds ON sds.user_id = p.id
  LEFT JOIN streak_calc sc ON sc.user_id = p.id
  WHERE p.consent_status != 'denied'
  ORDER BY total_coins_earned DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;


CREATE OR REPLACE FUNCTION get_leaderboard_30d(p_teacher_id UUID)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  instrument TEXT,
  total_coins_earned BIGINT,
  practice_days BIGINT,
  current_streak BIGINT
) AS $$
  WITH thirty_day_sessions AS (
    SELECT
      ps.user_id,
      SUM(ps.coins_earned) AS total_coins,
      COUNT(DISTINCT DATE(ps.created_at)) AS days
    FROM practice_sessions ps
    INNER JOIN teacher_students ts ON ts.student_id = ps.user_id AND ts.teacher_id = p_teacher_id
    WHERE ps.created_at >= NOW() - INTERVAL '30 days'
    GROUP BY ps.user_id
  ),
  streak_calc AS (
    SELECT
      ps.user_id,
      COUNT(DISTINCT DATE(ps.created_at)) AS streak
    FROM practice_sessions ps
    INNER JOIN teacher_students ts ON ts.student_id = ps.user_id AND ts.teacher_id = p_teacher_id
    WHERE ps.created_at >= (
      SELECT MIN(d) FROM (
        SELECT DISTINCT DATE(created_at) AS d
        FROM practice_sessions
        WHERE user_id IN (SELECT student_id FROM teacher_students WHERE teacher_id = p_teacher_id)
        ORDER BY d DESC
        LIMIT 30
      ) sub
    )
    GROUP BY ps.user_id
  )
  SELECT
    p.id AS user_id,
    COALESCE(NULLIF(p.display_name, ''), NULLIF(p.full_name, ''), SPLIT_PART(p.email, '@', 1)) AS display_name,
    p.instrument,
    COALESCE(tds.total_coins, 0) AS total_coins_earned,
    COALESCE(tds.days, 0) AS practice_days,
    COALESCE(sc.streak, 0) AS current_streak
  FROM profiles p
  INNER JOIN teacher_students ts ON ts.student_id = p.id AND ts.teacher_id = p_teacher_id
  LEFT JOIN thirty_day_sessions tds ON tds.user_id = p.id
  LEFT JOIN streak_calc sc ON sc.user_id = p.id
  WHERE p.consent_status != 'denied'
  ORDER BY total_coins_earned DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER;