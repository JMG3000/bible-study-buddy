do $$
declare
  seed_author uuid;
begin
  select user_id
  into seed_author
  from public.profiles
  where handle = 'jakobywonkonobi'
  limit 1;

  if seed_author is null then
    raise notice 'Skipping public-domain starter lesson seed: profile handle jakobywonkonobi was not found.';
    return;
  end if;

  insert into public.lesson_plans (
    id,
    author_id,
    author_handle,
    slug,
    status,
    moderation_state,
    title,
    summary,
    teaching_objective,
    duration_minutes,
    topic_tags,
    audience_tags,
    denomination_tags,
    custom_tags,
    opening_prayer,
    icebreaker,
    facilitator_notes,
    materials,
    activities,
    discussion_questions,
    prayer_prompts,
    handout_urls,
    published_at
  )
  values
    (
      '11111111-1111-4111-8111-111111111111',
      seed_author,
      'jakobywonkonobi',
      'prayer-that-listens',
      'published',
      'none',
      'Prayer That Listens',
      'A practical small-group lesson on asking, listening, and responding to God with humility and trust.',
      'Help participants practice prayer as honest conversation with God and attentive response to his guidance.',
      45,
      array['Prayer', 'Discipleship', 'Listening'],
      array['Small Groups', 'New Believers', 'Friends'],
      array['Interdenominational'],
      array['starter lesson', 'public-domain references', 'spiritual habits'],
      'Lord, teach us to come honestly, listen patiently, and trust you with what we cannot control.',
      'Invite each person to share one place where listening well changed a conversation.',
      'Keep the conversation gentle and practical. Encourage silence after the Scripture reference is read so the room can slow down before discussion.',
      array['Bibles or Bible app', 'Notebook or shared paper', 'Pens'],
      array['Practice two minutes of quiet prayer.', 'Pair up and name one request, one gratitude, and one next faithful step.', 'Close by praying for courage to listen during the week.'],
      array['What makes prayer feel difficult or distant sometimes?', 'What does persistence in prayer teach us about trust?', 'How can our group become a safer place for honest prayer?'],
      array['Ask God for a listening heart.', 'Pray for one person who needs encouragement.', 'Thank God for one answered prayer, even if it came slowly.'],
      '{}',
      timezone('utc', now())
    ),
    (
      '22222222-2222-4222-8222-222222222222',
      seed_author,
      'jakobywonkonobi',
      'hospitality-at-the-table',
      'published',
      'none',
      'Hospitality at the Table',
      'A welcoming lesson on making room for people through presence, humility, and practical care.',
      'Help participants identify one simple act of hospitality that reflects the welcome of Christ.',
      50,
      array['Hospitality', 'Community', 'Welcome'],
      array['Hosts', 'Families', 'Friends'],
      array['Interdenominational'],
      array['starter lesson', 'public-domain references', 'table fellowship'],
      'God of welcome, make our tables, homes, and conversations places where people can breathe and belong.',
      'Ask the group to name a meal or gathering where they felt truly welcomed.',
      'Do not let hospitality become performance. Guide the group toward simple, accessible practices.',
      array['Bibles or Bible app', 'Index cards', 'Pens'],
      array['List three barriers that keep people from offering hospitality.', 'Choose one low-cost welcome practice for this week.', 'Pray over names of people who may need an invitation.'],
      array['What is the difference between entertaining and welcoming?', 'Who is easy to overlook when we plan gatherings?', 'What small action could make your space more open this week?'],
      array['Pray for eyes to notice isolated people.', 'Ask God to remove fear around imperfect hospitality.', 'Bless homes, classrooms, and tables used for ministry.'],
      '{}',
      timezone('utc', now())
    ),
    (
      '33333333-3333-4333-8333-333333333333',
      seed_author,
      'jakobywonkonobi',
      'courage-to-encourage',
      'published',
      'none',
      'Courage to Encourage',
      'A lesson about strengthening one another through presence, truthful words, and faithful consistency.',
      'Help participants build a weekly rhythm of encouragement rooted in hope and shared commitment.',
      40,
      array['Encouragement', 'Community', 'Perseverance'],
      array['Small Groups', 'Teams', 'Friends'],
      array['Interdenominational'],
      array['starter lesson', 'public-domain references', 'care'],
      'Faithful God, give us words that build up and courage to show up for one another.',
      'Invite each person to remember a sentence someone said that helped them keep going.',
      'Encouragement should be specific and truthful. Steer away from shallow positivity.',
      array['Bibles or Bible app', 'Blank cards', 'Pens'],
      array['Write a short encouragement note during the session.', 'Name one group habit that helps people stay connected.', 'Choose one person to encourage before the next meeting.'],
      array['Why do people sometimes withhold encouragement?', 'What kind of encouragement feels meaningful instead of forced?', 'How can gathering together strengthen faith during pressure?'],
      array['Pray for people who are tired.', 'Ask God for timely words.', 'Thank God for someone who encouraged you.'],
      '{}',
      timezone('utc', now())
    ),
    (
      '44444444-4444-4444-8444-444444444444',
      seed_author,
      'jakobywonkonobi',
      'serving-with-open-hands',
      'published',
      'none',
      'Serving with Open Hands',
      'A leadership lesson on humble service, practical love, and following Jesus in ordinary tasks.',
      'Help participants connect spiritual leadership with concrete acts of service that honor others.',
      55,
      array['Service', 'Leadership', 'Humility'],
      array['Leaders', 'Hosts', 'Small Groups'],
      array['Interdenominational'],
      array['starter lesson', 'public-domain references', 'servant leadership'],
      'Jesus, reshape our idea of leadership so that our hands become ready for humble love.',
      'Ask the group to name an unnoticed act of service that made a real difference.',
      'Make room for honest conversation about pride, fatigue, and resentment in serving.',
      array['Bibles or Bible app', 'Whiteboard or shared notes', 'Pens'],
      array['Identify one unseen task your group depends on.', 'Plan a shared service action that can be completed this week.', 'Bless the people who usually serve quietly.'],
      array['Why can humble service feel threatening to our pride?', 'What does service reveal about what we value?', 'Where is Jesus inviting you to serve without needing attention?'],
      array['Pray for humility without shame.', 'Pray for leaders to serve with joy.', 'Ask God to show one practical need nearby.'],
      '{}',
      timezone('utc', now())
    ),
    (
      '55555555-5555-4555-8555-555555555555',
      seed_author,
      'jakobywonkonobi',
      'wisdom-for-peacemakers',
      'published',
      'none',
      'Wisdom for Peacemakers',
      'A discussion-based lesson on gentle wisdom, conflict repair, and peaceable action.',
      'Help participants recognize peaceable wisdom and choose one concrete step toward reconciliation or repair.',
      50,
      array['Wisdom', 'Peacemaking', 'Conflict'],
      array['Small Groups', 'Teams', 'Friends'],
      array['Interdenominational'],
      array['starter lesson', 'public-domain references', 'relationships'],
      'God of peace, give us wisdom that is gentle, truthful, and brave enough to repair what has been strained.',
      'Ask each person to describe one mark of a wise peacemaker.',
      'Keep the group from processing private conflict details about absent people. Focus on personal posture and next steps.',
      array['Bibles or Bible app', 'Notebook or shared paper', 'Pens'],
      array['Compare peacekeeping, people-pleasing, and peacemaking.', 'Write one sentence you could use to begin a repair conversation.', 'Pray for wisdom before acting.'],
      array['What kind of wisdom helps a tense room become safer?', 'How can gentleness and honesty work together?', 'What is one repair step that is yours to take?'],
      array['Pray for humility in conflict.', 'Ask God for timing and courage.', 'Pray for peace that does not avoid truth.'],
      '{}',
      timezone('utc', now())
    )
  on conflict (id) do update
  set
    author_id = excluded.author_id,
    author_handle = excluded.author_handle,
    title = excluded.title,
    summary = excluded.summary,
    teaching_objective = excluded.teaching_objective,
    duration_minutes = excluded.duration_minutes,
    topic_tags = excluded.topic_tags,
    audience_tags = excluded.audience_tags,
    denomination_tags = excluded.denomination_tags,
    custom_tags = excluded.custom_tags,
    opening_prayer = excluded.opening_prayer,
    icebreaker = excluded.icebreaker,
    facilitator_notes = excluded.facilitator_notes,
    materials = excluded.materials,
    activities = excluded.activities,
    discussion_questions = excluded.discussion_questions,
    prayer_prompts = excluded.prayer_prompts,
    status = excluded.status,
    moderation_state = excluded.moderation_state,
    slug = excluded.slug,
    published_at = coalesce(public.lesson_plans.published_at, excluded.published_at);

  delete from public.scripture_refs
  where lesson_plan_id in (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-555555555555'
  );

  insert into public.scripture_refs (
    lesson_plan_id,
    sequence,
    book_code,
    chapter_start,
    verse_start,
    chapter_end,
    verse_end,
    display_label
  )
  values
    ('11111111-1111-4111-8111-111111111111', 1, 42, 11, 1, 11, 13, 'Luke 11:1-13'),
    ('22222222-2222-4222-8222-222222222222', 1, 42, 14, 12, 14, 14, 'Luke 14:12-14'),
    ('33333333-3333-4333-8333-333333333333', 1, 58, 10, 23, 10, 25, 'Hebrews 10:23-25'),
    ('44444444-4444-4444-8444-444444444444', 1, 43, 13, 12, 13, 17, 'John 13:12-17'),
    ('55555555-5555-4555-8555-555555555555', 1, 59, 3, 13, 3, 18, 'James 3:13-18');

  insert into public.study_series (
    id,
    author_id,
    author_handle,
    slug,
    status,
    title,
    summary,
    published_at
  )
  values
    (
      '66666666-6666-4666-8666-666666666666',
      seed_author,
      'jakobywonkonobi',
      'everyday-discipleship-practices',
      'published',
      'Everyday Discipleship Practices',
      'A three-part path for groups learning simple rhythms of prayer, welcome, and encouragement.',
      timezone('utc', now())
    ),
    (
      '77777777-7777-4777-8777-777777777777',
      seed_author,
      'jakobywonkonobi',
      'leading-through-service-and-peace',
      'published',
      'Leading Through Service and Peace',
      'A three-part path for hosts and leaders practicing humble service, encouragement, and peaceable wisdom.',
      timezone('utc', now())
    )
  on conflict (id) do update
  set
    author_id = excluded.author_id,
    author_handle = excluded.author_handle,
    title = excluded.title,
    summary = excluded.summary,
    status = excluded.status,
    slug = excluded.slug,
    published_at = coalesce(public.study_series.published_at, excluded.published_at);

  delete from public.study_series_lessons
  where series_id in (
    '66666666-6666-4666-8666-666666666666',
    '77777777-7777-4777-8777-777777777777'
  );

  insert into public.study_series_lessons (series_id, lesson_plan_id, position)
  values
    ('66666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111', 1),
    ('66666666-6666-4666-8666-666666666666', '22222222-2222-4222-8222-222222222222', 2),
    ('66666666-6666-4666-8666-666666666666', '33333333-3333-4333-8333-333333333333', 3),
    ('77777777-7777-4777-8777-777777777777', '44444444-4444-4444-8444-444444444444', 1),
    ('77777777-7777-4777-8777-777777777777', '33333333-3333-4333-8333-333333333333', 2),
    ('77777777-7777-4777-8777-777777777777', '55555555-5555-4555-8555-555555555555', 3)
  on conflict (series_id, lesson_plan_id) do update
  set position = excluded.position;
end;
$$;
